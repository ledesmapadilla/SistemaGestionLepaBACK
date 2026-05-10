import mongoose from "mongoose";

const personalSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
    },
    semanal: [
      {
        valor: { type: Number, required: true },
        fecha: { type: String },
        cantJornales: { type: Number, default: 0 },
      },
    ],
    activo: { type: Boolean, default: true },
    fechaAlta: { type: String, default: null },
    fechaDesactivado: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Personal", personalSchema);
