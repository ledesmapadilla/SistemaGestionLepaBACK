import mongoose from "mongoose";

const extraSchema = new mongoose.Schema({
  fecha: { type: String },
  descuentaAumenta: { type: String, default: "aumenta" },
  monto: { type: Number, default: 0 },
  detalle: { type: String, default: "" },
  // "dif" identifica la fila generada automáticamente por la diferencia horaria
  // (hs extras / horas descontadas); se recalcula en cada carga.
  auto: { type: String, default: "" },
}, { _id: false });

const registroSchema = new mongoose.Schema({
  personal: { type: String },
  semanal: { type: Number, default: 0 },
  ausentismo: { type: Number, default: 0 },
  extras: { type: [extraSchema], default: [] },
  observaciones: { type: String, default: "" },
  pagado: { type: Number, default: 0 },
  marcado: { type: Number, default: 0 },
  seleccionado: { type: Boolean, default: false },
}, { _id: false, strict: false });

const proveedorSchema = new mongoose.Schema({
  proveedor: { type: String, default: "" },
  deuda: { type: Number, default: 0 },
  pago: { type: Number, default: 0 },
  observaciones: { type: String, default: "" },
  libre: { type: Boolean, default: false },
  marcado: { type: Number, default: 0 },
  pagoId: { type: String, default: "" },
}, { _id: false, strict: false });

const gastoSemanalSchema = new mongoose.Schema(
  {
    semana: { type: String, required: true, unique: true },
    registros: [registroSchema],
    proveedores: { type: [proveedorSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("GastoSemanal", gastoSemanalSchema);
