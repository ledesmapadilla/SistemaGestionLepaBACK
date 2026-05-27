import mongoose from "mongoose";

const registroBateriaSchema = new mongoose.Schema(
  {
    bateria:      { type: mongoose.Schema.Types.ObjectId, ref: "Bateria", required: true },
    maquina:      { type: mongoose.Schema.Types.ObjectId, ref: "Maquina", required: true },
    observaciones:{ type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("RegistroBateria", registroBateriaSchema);
