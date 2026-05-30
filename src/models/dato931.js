import mongoose from "mongoose";

const dato931Schema = new mongoose.Schema(
  {
    anio:  { type: Number, required: true },
    mes:   { type: Number, required: true },
    tipo:  { type: String, required: true, trim: true },
    valor:         { type: Number, default: null },
    observaciones: { type: String, default: "" },
  },
  { timestamps: true }
);

dato931Schema.index({ anio: 1, mes: 1, tipo: 1 }, { unique: true });

export default mongoose.model("Dato931", dato931Schema);
