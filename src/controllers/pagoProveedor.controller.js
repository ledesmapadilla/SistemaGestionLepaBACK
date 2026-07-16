import mongoose from "mongoose";
import PagoProveedor from "../models/pagoProveedor.js";
import FacturaProveedor from "../models/facturaProveedor.js";
import Cobro from "../models/cobro.js";
import ChequePropio from "../models/chequePropio.js";

const totalFactura = (f) =>
  f.tipoFactura === "Factura X" || f.tipoFactura === "Factura B" ? f.total : f.total * 1.21;

const recalcularEstados = async (facturaIds) => {
  const ids = [...new Set(facturaIds.map((id) => id?.toString()).filter(Boolean))];
  if (ids.length === 0) return;

  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

  // Una sola consulta para traer las facturas y otra para sumar lo pagado por factura
  const [facturas, pagados] = await Promise.all([
    FacturaProveedor.find({ _id: { $in: objectIds } }),
    PagoProveedor.aggregate([
      { $match: { "pagos.factura": { $in: objectIds } } },
      { $unwind: "$pagos" },
      { $match: { "pagos.factura": { $in: objectIds } } },
      { $group: { _id: "$pagos.factura", total: { $sum: "$pagos.montoPagado" } } },
    ]),
  ]);

  const pagadoPorFactura = {};
  pagados.forEach((p) => { if (p._id) pagadoPorFactura[p._id.toString()] = p.total; });

  await Promise.all(
    facturas.map((factura) => {
      const totalPagado = pagadoPorFactura[factura._id.toString()] || 0;
      const estadoPago = totalPagado >= totalFactura(factura) - 0.01 ? "Pagada" : "Pendiente";
      return FacturaProveedor.updateOne({ _id: factura._id }, { estadoPago });
    })
  );
};

export const obtenerPagosProveedores = async (req, res) => {
  try {
    const { obra } = req.query;
    let pagoQuery = {};
    if (obra) {
      const facturasConObra = await FacturaProveedor.find({ obra }, { _id: 1 });
      const ids = facturasConObra.map((f) => f._id);
      pagoQuery = { "pagos.factura": { $in: ids } };
    }
    const pagos = await PagoProveedor.find(pagoQuery).sort({ createdAt: -1 });
    const facturaIds = [...new Set(
      pagos.flatMap((p) => (p.pagos || []).map((i) => i.factura?.toString()).filter(Boolean))
    )];
    const facturas = await FacturaProveedor.find({ _id: { $in: facturaIds } });
    const facturaMap = {};
    facturas.forEach((f) => { facturaMap[f._id.toString()] = f.toObject(); });
    const pagosPopulados = pagos.map((p) => ({
      ...p.toObject(),
      pagos: (p.pagos || []).map((i) => ({
        ...i.toObject(),
        factura: facturaMap[i.factura?.toString()] ?? null,
      })),
    }));
    res.status(200).json(pagosPopulados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener pagos de proveedores" });
  }
};

export const crearPagoProveedor = async (req, res) => {
  try {
    const { fecha, proveedor, observaciones, mediosPago, pagos } = req.body;
    const nuevoPago = new PagoProveedor({ fecha, proveedor, observaciones, mediosPago, pagos });
    await nuevoPago.save();
    await recalcularEstados((pagos || []).map((p) => p.factura));
    res.status(201).json({ msg: "Pago registrado correctamente", pago: nuevoPago });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear pago de proveedor" });
  }
};

export const crearPagoEfectivoProveedor = async (req, res) => {
  try {
    const { proveedor, monto, fecha } = req.body;
    const montoNum = Number(monto) || 0;
    if (!proveedor || montoNum <= 0) {
      return res.status(400).json({ msg: "Proveedor y monto válido son requeridos" });
    }

    // Consultas en paralelo para agilizar la respuesta
    const [facturas, pagosPrevios] = await Promise.all([
      FacturaProveedor.find({
        proveedor,
        tipoFactura: { $ne: "Nota de Crédito" },
      }).sort({ fecha: 1 }),
      PagoProveedor.aggregate([
        { $match: { proveedor } },
        { $unwind: "$pagos" },
        { $group: { _id: "$pagos.factura", total: { $sum: "$pagos.montoPagado" } } },
      ]),
    ]);
    const pagadoPorFactura = {};
    pagosPrevios.forEach((p) => { if (p._id) pagadoPorFactura[p._id.toString()] = p.total; });

    // Facturas con saldo pendiente (más viejas primero)
    const facturasPend = facturas
      .map((f) => ({ id: f._id, pendiente: totalFactura(f) - (pagadoPorFactura[f._id.toString()] || 0) }))
      .filter((x) => x.pendiente > 0.01);

    if (facturasPend.length === 0) {
      return res.status(400).json({ msg: "El proveedor no tiene deuda pendiente para imputar el pago" });
    }

    // Imputación FIFO con redondeo de hasta $1: si lo que queda de una factura
    // es menor o igual a $1, se salda completa (no quedan saldos de centavos).
    let restante = montoNum;
    const asignaciones = [];
    for (const x of facturasPend) {
      if (restante <= 0.01) break;
      let aplicar = Math.min(restante, x.pendiente);
      if (x.pendiente - aplicar <= 1) aplicar = x.pendiente;
      asignaciones.push({ factura: x.id, montoPagado: aplicar });
      restante -= aplicar;
    }
    // Excedente real (> $1) se imputa a la última factura; un sobrante menor
    // (diferencia de centavos por el redondeo del monto) se descarta.
    if (restante > 1) {
      asignaciones[asignaciones.length - 1].montoPagado += restante;
    }

    const totalImputado = asignaciones.reduce((s, a) => s + a.montoPagado, 0);

    const nuevoPago = new PagoProveedor({
      fecha: fecha || new Date().toLocaleDateString("en-CA"),
      proveedor,
      mediosPago: [{ medioPago: "Efectivo gastos semanal", monto: totalImputado }],
      pagos: asignaciones,
    });
    await nuevoPago.save();
    await recalcularEstados(asignaciones.map((a) => a.factura));
    res.status(201).json({ msg: "Pago en efectivo registrado", pago: nuevoPago });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al registrar pago en efectivo", detalle: error.message });
  }
};

export const editarPagoProveedor = async (req, res) => {
  try {
    const pagoAnterior = await PagoProveedor.findById(req.params.id);
    if (!pagoAnterior) return res.status(404).json({ msg: "Pago no encontrado" });
    const idsAnteriores = (pagoAnterior.pagos || []).map((p) => p.factura);
    const pagoActualizado = await PagoProveedor.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    const idsNuevos = ((req.body.pagos) || []).map((p) => p.factura);
    await recalcularEstados([...idsAnteriores, ...idsNuevos]);
    res.status(200).json({ msg: "Pago actualizado", pago: pagoActualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar pago de proveedor" });
  }
};

export const eliminarPagoProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const pago = await PagoProveedor.findById(id);
    if (!pago) return res.status(404).json({ msg: "Pago no encontrado" });

    // Procesar los medios de pago para restaurar cheques
    if (pago.mediosPago && pago.mediosPago.length > 0) {
      for (const m of pago.mediosPago) {
        if (m.medioPago === "Cheque tercero" || m.medioPago === "E-Cheq tercero") {
          const tipoCheque = m.medioPago === "Cheque tercero" ? "Cheque" : "E-Cheq";
          // Buscar el cobro que contiene este cheque con el estado "Pago proveedores"
          const cobro = await Cobro.findOne({
            "mediosPago": {
              $elemMatch: {
                medioPago: tipoCheque,
                numeroCheque: m.numeroCheque,
                estado: "Pago proveedores"
              }
            }
          });

          if (cobro) {
            const index = cobro.mediosPago.findIndex(
              (c) => c.medioPago === tipoCheque && c.numeroCheque === m.numeroCheque && c.estado === "Pago proveedores"
            );
            if (index !== -1) {
              await Cobro.updateOne(
                { _id: cobro._id },
                {
                  $set: {
                    [`mediosPago.${index}.estado`]: "En cartera",
                    [`mediosPago.${index}.proveedor`]: ""
                  }
                }
              );
            }
          }
        } else if (m.medioPago === "Cheque propio" || m.medioPago === "E-Cheq propio") {
          // Eliminar el cheque propio emitido para este pago
          await ChequePropio.deleteOne({ numeroCheque: m.numeroCheque });
        }
      }
    }

    await PagoProveedor.findByIdAndDelete(id);
    await recalcularEstados((pago.pagos || []).map((p) => p.factura));
    res.status(200).json({ msg: "Pago eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar pago de proveedor" });
  }
};
