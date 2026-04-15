import Factura from "../models/factura.js";
import Remito from "../models/remito.js";

export const obtenerFacturas = async (req, res) => {
  try {
    const facturas = await Factura.find()
      .populate({ path: "remitos", populate: { path: "obra" } })
      .sort({ createdAt: -1 });
    res.status(200).json(facturas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener facturas" });
  }
};

export const crearFactura = async (req, res) => {
  try {
    const { fecha, tipoFactura, numeroFactura, cliente, remitos, total } = req.body;

    const nuevaFactura = new Factura({ fecha, tipoFactura, numeroFactura, cliente, remitos, total });
    await nuevaFactura.save();

    console.log("IDs a actualizar:", remitos);
    const resultado = await Remito.updateMany({ _id: { $in: remitos } }, { estado: "Facturado" });
    console.log("Remitos actualizados:", resultado.modifiedCount);

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

    await Remito.updateMany({ _id: { $in: factura.remitos } }, { estado: "Sin facturar" });

    await Factura.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Factura eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar factura" });
  }
};
