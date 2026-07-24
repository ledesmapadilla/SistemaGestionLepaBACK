import mongoose from "mongoose";

const repuestoSchema = new mongoose.Schema(
  {
    id: { type: String },
    repuesto: { type: String, default: "" },
    cantidad: { type: Number, default: 0 },
    precio: { type: Number, default: 0 },
    proveedor: { type: String, default: "" },
    responsable: { type: String, default: "" },
    estado: { type: String, default: "Pedido" },
    observaciones: { type: String, default: "" },
  },
  { _id: false }
);

const itemReparacionSchema = new mongoose.Schema(
  {
    id: { type: String },
    fecha: { type: String },
    reparacion: { type: String, default: "" },
    descripcion: { type: String, default: "" },
    parte: { type: String, default: "" },
    prioridad: { type: String, default: "Normal" },
    estado: { type: String, default: "Pendiente" },
    maquinaParada: { type: Boolean, default: false },
    observaciones: { type: String, default: "" },
    repuestos: { type: [repuestoSchema], default: [] },
    // Texto libre de la página de Detalle de reparación.
    detalleTexto: { type: String, default: "" },
    // Vínculo con una tarea de Pendientes (para mantenerlas sincronizadas).
    pendResp: { type: String, default: "" },
    pendTaskId: { type: String, default: "" },
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
