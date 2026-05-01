import mongoose from "mongoose";

const serviceMaquinaSchema = new mongoose.Schema(
  {
    maquina: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Maquina",
      required: true,
    },
    horometro: {
      type: Number,
    },
    estado: {
      type: String,
    },
    observaciones: {
      type: String,
    },
    tipo: {
      type: String,
      enum: ["horas", "service"],
      default: "service",
    },
    fecha: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ServiceMaquina", serviceMaquinaSchema);
