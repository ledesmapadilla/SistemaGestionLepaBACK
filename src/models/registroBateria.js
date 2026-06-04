import mongoose from "mongoose";

const historialEntrySchema = new mongoose.Schema(
  {
    maquina:       { type: mongoose.Schema.Types.ObjectId, ref: "Maquina" },
    maquinaLabel:  { type: String, default: "" },
    fecha:         { type: String, default: "" },
    observaciones: { type: String, default: "" },
    editadoEn:     { type: Date, default: Date.now },
  },
  { _id: false }
);

const registroBateriaSchema = new mongoose.Schema(
  {
    bateria:       { type: mongoose.Schema.Types.ObjectId, ref: "Bateria", required: true },
    maquina:       { type: mongoose.Schema.Types.ObjectId, ref: "Maquina" },
    maquinaLabel:  { type: String, default: "" },
    fecha:         { type: String, default: "" },
    observaciones: { type: String, default: "" },
    historial:     { type: [historialEntrySchema], default: [] },
  },
  { timestamps: true }
);

registroBateriaSchema.index({ createdAt: -1 });

export default mongoose.model("RegistroBateria", registroBateriaSchema);
