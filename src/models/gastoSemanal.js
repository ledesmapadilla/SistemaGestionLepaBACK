import mongoose from "mongoose";

const registroSchema = new mongoose.Schema({
  personal: { type: String },
  semanal: { type: Number, default: 0 },
  ausentismo: { type: Number, default: 0 },
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
