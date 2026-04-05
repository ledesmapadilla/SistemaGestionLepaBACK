import mongoose, { Schema } from "mongoose";

const aceiteSchema = new Schema(
  {
    tipo: { type: String, required: true },
    marca: { type: String, required: true, trim: true },
    denominacion: { type: String, trim: true },
    uso: { type: String, required: true, trim: true },

    movimientos: [
      {
        tipoMov: { type: String, enum: ["INGRESO", "SALIDA"], required: true },
        fecha: { type: Date, required: true },
        proveedor: { type: String },
        marca: { type: String },
        litros: { type: Number, required: true },
        precio: { type: Number },
        maquina: { type: String },
        obra: { type: String },
        observaciones: { type: String, default: "" },
      }
    ],
  },
  { timestamps: true }
);

const Aceite = mongoose.model("Aceite", aceiteSchema);
export default Aceite;
