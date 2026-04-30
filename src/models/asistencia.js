import mongoose from "mongoose";

const registroSchema = new mongoose.Schema({
  personal: { type: String },
  ausente: { type: Boolean, default: false },
  entra: { type: String },
  sale: { type: String },
  maquina: { type: String },
  horometro: { type: String },
  obra: { type: String },
  observaciones: { type: String },
  personalLibre: { type: Boolean, default: false },
}, { _id: false });

const asistenciaSchema = new mongoose.Schema(
  {
    fecha: { type: String, required: true, unique: true },
    registros: [registroSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Asistencia", asistenciaSchema);
