import mongoose from "mongoose";
import PagoProveedor from "../models/pagoProveedor.js";
import FacturaProveedor from "../models/facturaProveedor.js";

const totalFactura = (f) =>
  f.tipoFactura === "Factura X" || f.tipoFactura === "Factura B" ? f.total : f.total * 1.21;

const recalcularEstados = async (facturaIds) => {
  const ids = [...new Set(facturaIds.map((id) => id?.toString()).filter(Boolean))];
  for (const facturaId of ids) {
    const factura = await FacturaProveedor.findById(facturaId);
    if (!factura) continue;
    const totalAPagar = totalFactura(factura);
    const resultado = await PagoProveedor.aggregate([
      { $unwind: "$pagos" },
      { $match: { "pagos.factura": new mongoose.Types.ObjectId(facturaId) } },
      { $group: { _id: null, total: { $sum: "$pagos.montoPagado" } } },
    ]);
    const totalPagado = resultado[0]?.total || 0;
    const estadoPago = totalPagado >= totalAPagar - 0.01 ? "Pagada" : "Pendiente";
    await FacturaProveedor.findByIdAndUpdate(facturaId, { estadoPago });
  }
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
    const { fecha, proveedor, mediosPago, pagos } = req.body;
    const nuevoPago = new PagoProveedor({ fecha, proveedor, mediosPago, pagos });
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

    // Facturas del proveedor que generan deuda (excluye notas de crédito)
    const facturas = await FacturaProveedor.find({
      proveedor,
      tipoFactura: { $ne: "Nota de Crédito" },
    }).sort({ fecha: 1 });

    // Pagos ya imputados por factura
    const pagosPrevios = await PagoProveedor.aggregate([
      { $unwind: "$pagos" },
      { $group: { _id: "$pagos.factura", total: { $sum: "$pagos.montoPagado" } } },
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
    const pago = await PagoProveedor.findByIdAndDelete(req.params.id);
    if (!pago) return res.status(404).json({ msg: "Pago no encontrado" });
    await recalcularEstados((pago.pagos || []).map((p) => p.factura));
    res.status(200).json({ msg: "Pago eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar pago de proveedor" });
  }
};
