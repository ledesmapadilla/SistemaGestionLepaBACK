import mongoose from "mongoose";

const cubiertaSchema = new mongoose.Schema(
  {
    nombreCubierta: { type: String, required: true, unique: true, trim: true },
    marca:          { type: String, required: true },
    fecha:          { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Cubierta", cubiertaSchema);
