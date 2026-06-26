import FacturaProveedor from "../models/facturaProveedor.js";

export const obtenerFacturasProveedores = async (req, res) => {
  try {
    const facturas = await FacturaProveedor.find().sort({ createdAt: -1 });
    res.status(200).json(facturas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener facturas de proveedores" });
  }
};

export const crearFacturaProveedor = async (req, res) => {
  try {
    const { fecha, tipoFactura, numeroFactura, proveedor, concepto, observaciones, obra, total } = req.body;
    const nueva = new FacturaProveedor({ fecha, tipoFactura, numeroFactura, proveedor, concepto, observaciones, obra, total });
    await nueva.save();
    res.status(201).json({ msg: "Factura creada correctamente", factura: nueva });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear factura de proveedor" });
  }
};

export const editarFacturaProveedor = async (req, res) => {
  try {
    const facturaActualizada = await FacturaProveedor.findByIdAndUpdate(
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
    res.status(500).json({ msg: "Error al editar factura de proveedor" });
  }
};

export const eliminarFacturaProveedor = async (req, res) => {
  try {
    const factura = await FacturaProveedor.findByIdAndDelete(req.params.id);
    if (!factura) {
      return res.status(404).json({ msg: "Factura no encontrada" });
    }
    res.status(200).json({ msg: "Factura eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar factura de proveedor" });
  }
};
