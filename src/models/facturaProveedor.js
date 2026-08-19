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
    // Razon social a la que se imputa. Se autocompleta con la de la obra
    // elegida, pero puede editarse si la factura va a otra.
    razonsocial: { type: String, default: "" },
    total: { type: Number, default: 0 },
    estadoPago: {
      type: String,
      enum: ["Pendiente", "Pagada"],
      default: "Pendiente",
    },
  },
  { timestamps: true }
);

facturaProveedorSchema.index({ proveedor: 1 });
facturaProveedorSchema.index({ createdAt: -1 });

export default mongoose.model("FacturaProveedor", facturaProveedorSchema);
