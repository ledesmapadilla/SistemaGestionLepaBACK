import FacturaProveedor from "../models/facturaProveedor.js";
import PagoProveedor from "../models/pagoProveedor.js";

export const obtenerFacturasProveedores = async (req, res) => {
  try {
    const { estadoPago } = req.query;
    let query = {};
    if (estadoPago) {
      query.estadoPago = estadoPago;
    }
    const facturas = await FacturaProveedor.find(query).sort({ createdAt: -1 });
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
    const { id } = req.params;
    const factura = await FacturaProveedor.findById(id);
    if (!factura) {
      return res.status(404).json({ msg: "Factura no encontrada" });
    }

    // No permitir borrar una factura que tenga un pago asociado.
    const pagoAsociado = await PagoProveedor.findOne({ "pagos.factura": id }).lean();
    if (pagoAsociado) {
      return res.status(409).json({
        msg: "La factura tiene un pago asociado. Primero eliminá el pago en Pagos a Proveedores y luego podrás borrar la factura.",
      });
    }

    await FacturaProveedor.findByIdAndDelete(id);
    res.status(200).json({ msg: "Factura eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar factura de proveedor" });
  }
};
