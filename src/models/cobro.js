import mongoose from "mongoose";

const medioPagoSchema = new mongoose.Schema(
  {
    medioPago: {
      type: String,
      enum: ["Efectivo", "Cheque", "E-Cheq", "Retenciones", "Transferencia"],
    },
    monto: { type: Number },
    numeroCheque: { type: String, default: "" },
    fechaCobro: { type: String, default: "" },
    estado: {
      type: String,
      enum: ["En cartera", "Utilizado", "Depositado", "Pago proveedores", "Depósito en banco", "Cambio", "Otros"],
      default: "En cartera",
    },
    proveedor: { type: String, default: "" },
    observaciones: { type: String, default: "" },
  },
  { _id: false }
);

const pagoSchema = new mongoose.Schema(
  {
    factura: { type: mongoose.Schema.Types.ObjectId, ref: "Factura", required: true },
    montoCobrado: { type: Number, required: true },
    medioPago: {
      type: String,
      enum: ["Efectivo", "Cheque", "E-Cheq", "Retenciones", "Transferencia"],
    },
    observaciones: { type: String, default: "" },
  },
  { _id: false }
);

const cobroSchema = new mongoose.Schema(
  {
    fecha: { type: String, required: true },
    cliente: { type: String, required: true },
    medioPago: { type: String },
    mediosPago: [medioPagoSchema],
    pagos: [pagoSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Cobro", cobroSchema);
