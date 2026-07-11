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
    talles: {
      camisa: { type: String, default: "" },
      pantalon: { type: String, default: "" },
      botines: { type: String, default: "" },
      otros: { type: String, default: "" }
    },
  },
  { timestamps: true }
);

export default mongoose.model("Personal", personalSchema);
