import mongoose from "mongoose";

const obraSchema = new mongoose.Schema(
  {
    razonsocial: {
      type: String,
      required: true,
    },
    nombreobra: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    contacto: {
      type: String,
      required: true,
    },

    estado: {
      type: String,
      required: true,
    },
    fecha: {
      type: Date,
      required: true,
    },
    precio: [
      {
        trabajo: { type: String, required: true },
        clasificacion: { type: String, required: true },
        precio: { type: Number, required: true },
        unidad: { type: String, required: true },
        observaciones: { type: String, required: true },
        fecha: { type: Date },
      },
    ],

    descripcion: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Obra", obraSchema);
