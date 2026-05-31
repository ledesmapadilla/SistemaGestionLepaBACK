import mongoose from "mongoose";

const datoImpuestoSchema = new mongoose.Schema(
  {
    impuesto:      { type: String, required: true, trim: true },
    anio:          { type: Number, required: true },
    mes:           { type: Number, required: true },
    tipo:          { type: String, required: true, trim: true },
    valor:         { type: Number, default: null },
    observaciones: { type: String, default: "" },
    historial:     { type: [{ valor: Number, fecha: String, observaciones: String }], default: [] },
  },
  { timestamps: true }
);

datoImpuestoSchema.index({ impuesto: 1, anio: 1, mes: 1, tipo: 1 }, { unique: true });

export default mongoose.model("DatoImpuesto", datoImpuestoSchema);
