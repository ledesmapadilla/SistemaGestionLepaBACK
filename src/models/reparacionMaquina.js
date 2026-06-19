import mongoose from "mongoose";

const itemReparacionSchema = new mongoose.Schema(
  {
    id: { type: String },
    fecha: { type: String },
    reparacion: { type: String, default: "" },
    descripcion: { type: String, default: "" },
    parte: { type: String, default: "" },
    prioridad: { type: String, default: "Normal" },
    estado: { type: String, default: "En proceso" },
  },
  { _id: false }
);

const reparacionMaquinaSchema = new mongoose.Schema(
  {
    maquina: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Maquina",
      required: true,
      unique: true,
    },
    reparaciones: { type: [itemReparacionSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("ReparacionMaquina", reparacionMaquinaSchema);
