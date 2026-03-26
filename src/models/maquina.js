import mongoose from "mongoose";

const maquinaSchema = new mongoose.Schema(
  {
    maquina: {
      type: String,
      required: true,
    },
    marca: { // <-- NUEVO CAMPO
      type: String,
    },
    costo: {
      type: Number,
      default: 0
    },
    descripcion: {
      type: String,
    },
    modelo: {
      type: String,
    },
    chasis: {
      type: String,
    },
    motor: {
      type: String,
    },
    anio: {
      type: Number,
    },
    patente: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Maquina", maquinaSchema);