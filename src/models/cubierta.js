import mongoose from "mongoose";

const cubiertaSchema = new mongoose.Schema(
  {
    nombreCubierta: { type: String, required: true, trim: true },
    categoria:      { type: String, default: "camiones", index: true },
    fecha:          { type: String, required: true },
  },
  { timestamps: true }
);

// Unicidad del nombre por categoría (ej.: puede existir "1" en camiones y "1" en palas)
cubiertaSchema.index({ nombreCubierta: 1, categoria: 1 }, { unique: true });

export default mongoose.model("Cubierta", cubiertaSchema);
