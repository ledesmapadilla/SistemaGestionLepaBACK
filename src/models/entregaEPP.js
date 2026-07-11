import mongoose from "mongoose";

const entregaEPPSchema = new mongoose.Schema(
  {
    personal: { type: String, required: true },
    fecha: { type: String, required: true }, // Formato: YYYY-MM-DD
    epp: { type: String, required: true }, // camisa, pantalon, botines, otros
    talle: { type: String, default: "" },
    cantidad: { type: Number, default: 1 },
    observaciones: { type: String, default: "" }
  },
  { timestamps: true }
);

// Índices para búsquedas eficientes
entregaEPPSchema.index({ personal: 1 });
entregaEPPSchema.index({ fecha: -1 });

export default mongoose.model("EntregaEPP", entregaEPPSchema);
