import mongoose from "mongoose";

const tareaSchema = new mongoose.Schema(
  {
    id: { type: String },
    fecha: { type: String, default: "" },
    tarea: { type: String, default: "" },
    dias: { type: String, default: "" },
    estado: { type: String, default: "Pendiente" },
    observaciones: { type: String, default: "" },
  },
  { _id: false }
);

const pendienteResponsableSchema = new mongoose.Schema(
  {
    responsable: { type: String, required: true, unique: true },
    tareas: { type: [tareaSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("PendienteResponsable", pendienteResponsableSchema);
