import mongoose from "mongoose";

const personalSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
    },
    semanal: [
      {
        valor: { type: Number, required: true },
        fecha: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Personal", personalSchema);
