import mongoose from "mongoose";

// Una carga de gasoil = un evento de carga de combustible en una máquina,
// hecha en una obra de un cliente. `fecha` se guarda como "YYYY-MM-DD" (igual
// que asistencia y entregaEPP) para evitar el desfase de timezone.
const cargaGasoilSchema = new mongoose.Schema(
  {
    fecha: { type: String, required: true },
    cliente: { type: String, required: true, trim: true },
    obra: { type: String, required: true, trim: true },
    maquina: { type: String, required: true, trim: true },
    litros: { type: Number, required: true, min: 0 },
    quienCarga: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

cargaGasoilSchema.index({ fecha: -1 });

export default mongoose.model("CargaGasoil", cargaGasoilSchema);
