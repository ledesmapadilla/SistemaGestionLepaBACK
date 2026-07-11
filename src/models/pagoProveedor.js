import mongoose from "mongoose";

const medioPagoSchema = new mongoose.Schema(
  {
    medioPago: {
      type: String,
      enum: ["Cheque propio", "Cheque tercero", "E-Cheq propio", "E-Cheq tercero", "Retenciones", "Efectivo", "Efectivo gastos semanal", "Transferencia"],
    },
    monto: { type: Number },
    numeroCheque: { type: String, default: "" },
    fechaCobro: { type: String, default: "" },
  },
  { _id: false }
);

const pagoItemSchema = new mongoose.Schema(
  {
    factura: { type: mongoose.Schema.Types.ObjectId, ref: "FacturaProveedor", required: true },
    montoPagado: { type: Number, required: true },
  },
  { _id: false }
);

const pagoProveedorSchema = new mongoose.Schema(
  {
    fecha: { type: String, required: true },
    proveedor: { type: String, required: true },
    observaciones: { type: String, default: "" },
    mediosPago: [medioPagoSchema],
    pagos: [pagoItemSchema],
  },
  { timestamps: true }
);

pagoProveedorSchema.index({ proveedor: 1 });
pagoProveedorSchema.index({ createdAt: -1 });

export default mongoose.model("PagoProveedor", pagoProveedorSchema);
