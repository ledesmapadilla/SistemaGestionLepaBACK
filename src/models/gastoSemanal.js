import mongoose from "mongoose";

const extraSchema = new mongoose.Schema({
  fecha: { type: String },
  tipo: { type: String },
  descuentaAumenta: { type: String, default: "aumenta" },
  monto: { type: Number, default: 0 },
  detalle: { type: String, default: "" },
}, { _id: false });

const registroSchema = new mongoose.Schema({
  personal: { type: String },
  semanal: { type: Number, default: 0 },
  ausentismo: { type: Number, default: 0 },
  extras: { type: [extraSchema], default: [] },
  observaciones: { type: String, default: "" },
}, { _id: false });

const gastoSemanalSchema = new mongoose.Schema(
  {
    semana: { type: String, required: true, unique: true },
    registros: [registroSchema],
  },
  { timestamps: true }
);

export default mongoose.model("GastoSemanal", gastoSemanalSchema);
