import mongoose from "mongoose";

const medioPagoSchema = new mongoose.Schema(
  {
    medioPago: {
      type: String,
      enum: ["Cheque propio", "Cheque tercero", "E-Cheq propio", "E-Cheq tercero", "Retenciones", "Efectivo", "Transferencia"],
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
    mediosPago: [medioPagoSchema],
    pagos: [pagoItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("PagoProveedor", pagoProveedorSchema);
