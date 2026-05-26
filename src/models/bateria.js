import mongoose from "mongoose";

const bateriaSchema = new mongoose.Schema(
  {
    nombreBateria: { type: String, required: true },
    maquina: { type: mongoose.Schema.Types.ObjectId, ref: "Maquina", required: true },
    observaciones: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Bateria", bateriaSchema);
