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

const registroCubiertaSchema = new mongoose.Schema(
  {
    cubierta:      { type: mongoose.Schema.Types.ObjectId, ref: "Cubierta", required: true },
    categoria:     { type: String, default: "camiones", index: true },
    maquina:       { type: mongoose.Schema.Types.ObjectId, ref: "Maquina" },
    maquinaLabel:  { type: String, default: "" },
    fecha:         { type: String, default: "" },
    observaciones: { type: String, default: "" },
    historial:     { type: [historialEntrySchema], default: [] },
  },
  { timestamps: true }
);

registroCubiertaSchema.index({ createdAt: -1 });

export default mongoose.model("RegistroCubierta", registroCubiertaSchema);
