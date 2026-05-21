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
    const { fecha, tipoFactura, numeroFactura, cliente, remitos, total, montosPorRemito } = req.body;

    const nuevaFactura = new Factura({
      fecha, tipoFactura, numeroFactura, cliente, remitos, total,
      montosPorRemito: montosPorRemito || [],
    });
    await nuevaFactura.save();

    if (tipoFactura === "Nota de Crédito") {
      await Remito.updateMany({ _id: { $in: remitos } }, { estado: "Sin facturar" });
    } else if (montosPorRemito && montosPorRemito.length > 0) {
      for (const { remitoId, monto } of montosPorRemito) {
        const remito = await Remito.findById(remitoId);
        if (!remito) continue;
        const totalRemito = calcularTotalRemito(remito.items);
        const nuevoMonto = (remito.montoFacturado || 0) + Number(monto);
        const $set = { montoFacturado: nuevoMonto };
        if (nuevoMonto >= totalRemito) $set.estado = "Facturado";
        await Remito.findByIdAndUpdate(remitoId, { $set });
      }
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

    if (factura.montosPorRemito && factura.montosPorRemito.length > 0) {
      for (const { remitoId, monto } of factura.montosPorRemito) {
        const remito = await Remito.findById(remitoId);
        if (!remito) continue;
        const totalRemito = calcularTotalRemito(remito.items);
        const nuevoMonto = Math.max(0, (remito.montoFacturado || 0) - Number(monto));
        const $set = { montoFacturado: nuevoMonto };
        if (nuevoMonto < totalRemito) $set.estado = "Sin facturar";
        await Remito.findByIdAndUpdate(remitoId, { $set });
      }
    } else {
      await Remito.updateMany({ _id: { $in: factura.remitos } }, { estado: "Sin facturar" });
    }

    await Factura.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Factura eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar factura" });
  }
};
