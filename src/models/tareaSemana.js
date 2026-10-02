import mongoose from "mongoose";

// Copia de una tarea de Pendientes (manual, reparación o repuesto) asignada a una
// semana. `desde`/`hasta` definen la semana; `origenId` es el id de la fila en
// Pendientes y evita cargar dos veces la misma tarea en la misma semana.
const tareaSemanaItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    origenId: { type: String, default: "" },
    tipo: { type: String, default: "" }, // "", "reparacion" o "repuesto"
    desde: { type: String, required: true },
    hasta: { type: String, required: true },
    fecha: { type: String, default: "" },
    maquina: { type: String, default: "" },
    tarea: { type: String, default: "" },
    estado: { type: String, default: "Pendiente" },
    fechaTerminado: { type: String, default: "" },
    observaciones: { type: String, default: "" },
  },
  { _id: false }
);

const tareaSemanaSchema = new mongoose.Schema(
  {
    responsable: { type: String, required: true, unique: true },
    tareas: { type: [tareaSemanaItemSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("TareaSemana", tareaSemanaSchema);
