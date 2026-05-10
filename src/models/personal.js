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
  },
  { timestamps: true }
);

export default mongoose.model("Personal", personalSchema);
