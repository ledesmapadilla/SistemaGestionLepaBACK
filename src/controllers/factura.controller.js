import Factura from "../models/factura.js";
import Remito from "../models/remito.js";

export const obtenerFacturas = async (req, res) => {
  try {
    const facturas = await Factura.find()
      .populate({ path: "remitos", populate: { path: "obra" } })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(facturas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener facturas" });
  }
};

const calcularTotalRemito = (items = []) =>
  items.reduce((sum, i) => sum + Number(i.cantidad) * Number(i.precioUnitario), 0);

export const crearFactura = async (req, res) => {
  try {
    const { fecha, tipoFactura, numeroFactura, cliente, remitos, total, montosPorRemito, estadoPago, facturaAsociada } = req.body;

    // Un remito con total $0 no se puede facturar: quedaría marcado "Facturado"
    // por un importe de cero y, a partir de ahí, bloqueado. Es el caso del
    // remito automático de una obra de precio cerrado a la que todavía no se le
    // cargó el precio: primero hay que definirlo en la obra.
    if (tipoFactura !== "Nota de Crédito" && Array.isArray(remitos) && remitos.length > 0) {
      const aFacturar = await Remito.find({ _id: { $in: remitos } })
        .select("remito items")
        .lean();
      const sinPrecio = aFacturar.filter(
        (r) => Math.round(calcularTotalRemito(r.items) * 100) / 100 <= 0
      );
      if (sinPrecio.length > 0) {
        const numeros = sinPrecio.map((r) => `N° ${r.remito}`).join(", ");
        return res.status(400).json({
          msg: `El remito ${numeros} no tiene precio cargado (total $0) y no se puede facturar. Cargá el precio en la obra y volvé a intentar.`,
        });
      }
    }

    const nuevaFactura = new Factura({
      fecha, tipoFactura, numeroFactura, cliente, remitos, total,
      montosPorRemito: montosPorRemito || [],
      ...(estadoPago && { estadoPago }),
      ...(facturaAsociada && { facturaAsociada }),
    });
    await nuevaFactura.save();

    if (tipoFactura === "Nota de Crédito") {
      // Remitos a liberar: los del array propio de la NC + los de la factura asociada.
      const idsLiberar = new Set((remitos || []).map((id) => id.toString()));
      if (facturaAsociada) {
        const original = await Factura.findOneAndUpdate(
          { numeroFactura: facturaAsociada },
          { estadoPago: "Anulada" },
          { new: false }
        ).select("remitos").lean();
        (original?.remitos || []).forEach((id) => idsLiberar.add(id.toString()));
      }
      if (idsLiberar.size > 0) {
        await Remito.updateMany(
          { _id: { $in: [...idsLiberar] } },
          { estado: "Sin facturar", montoFacturado: 0 }
        );
      }
    } else if (montosPorRemito && montosPorRemito.length > 0) {
      const remitoIds = montosPorRemito.map((m) => m.remitoId);
      const remitosArr = await Remito.find({ _id: { $in: remitoIds } }).select("items montoFacturado").lean();
      const remitosMap = Object.fromEntries(remitosArr.map((r) => [r._id.toString(), r]));
      const bulkOps = montosPorRemito.map(({ remitoId, monto }) => {
        const remito = remitosMap[remitoId?.toString()];
        if (!remito) return null;
        const totalRemito = Math.round(calcularTotalRemito(remito.items) * 100) / 100;
        const saldoPendiente = Math.round((totalRemito - (remito.montoFacturado || 0)) * 100) / 100;
        const montoAplicado = Math.min(Math.round(Number(monto) * 100) / 100, saldoPendiente);
        const nuevoMonto = Math.round(((remito.montoFacturado || 0) + montoAplicado) * 100) / 100;
        const $set = { montoFacturado: nuevoMonto };
        // Solo se cierra como "Facturado" si el remito tiene importe real:
        // un total 0 nunca debe quedar sellado (ver validación de arriba).
        if (totalRemito > 0 && totalRemito - nuevoMonto < 1) $set.estado = "Facturado";
        return { updateOne: { filter: { _id: remitoId }, update: { $set } } };
      }).filter(Boolean);
      if (bulkOps.length > 0) await Remito.bulkWrite(bulkOps);
    } else {
      await Remito.updateMany({ _id: { $in: remitos } }, { estado: "Facturado" });
    }

    res.status(201).json({ msg: "Factura creada correctamente", factura: nuevaFactura });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear factura" });
  }
};

export const editarFactura = async (req, res) => {
  try {
    const facturaActualizada = await Factura.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!facturaActualizada) {
      return res.status(404).json({ msg: "Factura no encontrada" });
    }
    res.status(200).json({ msg: "Factura actualizada", factura: facturaActualizada });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar factura" });
  }
};

export const eliminarFactura = async (req, res) => {
  try {
    const factura = await Factura.findById(req.params.id);
    if (!factura) {
      return res.status(404).json({ msg: "Factura no encontrada" });
    }

    const remitosArr = await Remito.find({ _id: { $in: factura.remitos } }).select("items montoFacturado").lean();
    const remitosMap = Object.fromEntries(remitosArr.map((r) => [r._id.toString(), r]));
    const bulkOps = factura.remitos.map((remitoRef) => {
      const remito = remitosMap[remitoRef?.toString()];
      if (!remito) return null;
      const entrada = (factura.montosPorRemito || []).find(
        (m) => m.remitoId?.toString() === remitoRef?.toString()
      );
      const monto = entrada ? Number(entrada.monto) : 0;
      const totalRemito = Math.round(calcularTotalRemito(remito.items) * 100) / 100;
      const nuevoMonto = Math.max(0, Math.round(((remito.montoFacturado || 0) - monto) * 100) / 100);
      const $set = {
        montoFacturado: nuevoMonto,
        estado: totalRemito - nuevoMonto < 1 ? "Facturado" : "Sin facturar",
      };
      return { updateOne: { filter: { _id: remitoRef }, update: { $set } } };
    }).filter(Boolean);
    if (bulkOps.length > 0) await Remito.bulkWrite(bulkOps);

    await Factura.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Factura eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar factura" });
  }
};
