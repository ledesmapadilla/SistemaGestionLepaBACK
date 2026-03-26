import mongoose from "mongoose";

const precioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
    },
    fecha: {
      type: Date,
      required: true,
    },
    maquina: {
      type: String,
      required: true,
    },
    completo: {
      type: Number,
      required: true,
    },
    sinGasoil: {
      type: Number,
      required: true,
    },
    porcentajeReal: {
      type: Number,
      required: true,
    },
    porcentajeTeorico: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Precio", precioSchema);
