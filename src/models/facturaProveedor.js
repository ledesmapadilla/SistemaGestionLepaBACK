import mongoose from "mongoose";

const facturaProveedorSchema = new mongoose.Schema(
  {
    fecha: { type: String, required: true },
    tipoFactura: {
      type: String,
      required: true,
      enum: ["Factura A", "Factura B", "Factura C", "Factura X", "Nota de Crédito", "Nota de Débito"],
    },
    numeroFactura: { type: String, required: true },
    proveedor: { type: String, required: true },
    concepto: { type: String, default: "" },
    observaciones: { type: String, default: "" },
    obra: { type: String, default: "" },
    total: { type: Number, default: 0 },
    estadoPago: {
      type: String,
      enum: ["Pendiente", "Pagada"],
      default: "Pendiente",
    },
  },
  { timestamps: true }
);

export default mongoose.model("FacturaProveedor", facturaProveedorSchema);
