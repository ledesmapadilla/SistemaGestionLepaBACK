import mongoose from "mongoose";

// Pendientes que se anotan para la próxima reunión (botón Reunión).
// Un documento por tarea; al hacerse se marca "Terminado" y queda la fecha.
const pendienteReunionSchema = new mongoose.Schema(
  {
    fecha: { type: String, required: true },
    tarea: { type: String, required: true, trim: true },
    responsable: { type: String, default: "", trim: true },
    estado: { type: String, enum: ["Pendiente", "Terminado"], default: "Pendiente" },
    fechaTerminado: { type: String, default: "" },
    observaciones: { type: String, default: "" },
  },
  { timestamps: true }
);
pendienteReunionSchema.index({ estado: 1, fecha: -1 });

export default mongoose.model("PendienteReunion", pendienteReunionSchema);
