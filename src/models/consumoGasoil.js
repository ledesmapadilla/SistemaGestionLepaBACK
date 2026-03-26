import mongoose from "mongoose";

const consumoGasoilSchema = new mongoose.Schema(
  {
    consumos: [
      {
        maquina: { type: String, required: true },
        consumo: { type: Number, default: 0 },
      },
    ],
    porcentajeIndirectos: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ConsumoGasoil", consumoGasoilSchema);
