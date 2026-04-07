import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  fecha: {
    type: String,
    required: true,
  },
  personal: String,
  maquina: String,
  servicio: String,
  cantidad: {
    type: Number,
    required: true,
  },
  unidad: String,
  precioUnitario: {
    type: Number,
    required: true,
  },
  costoHoraPersonal: {
    type: Number,
    default: 0,
  },
  gasoil: Number,
  observaciones: String,
});

const remitoSchema = new mongoose.Schema(
  {
    obra: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Obra",
      required: true,
    },
    remito: {
      type: Number,
      required: true,
    },
    fecha: {
      type: String,
      required: false,
    },
    estado: {
      type: String,
      required: true,
    },
    items: [itemSchema],
  },
  { timestamps: true }
);
remitoSchema.index({ obra: 1, remito: 1 }, { unique: true });

export default mongoose.model("Remito", remitoSchema);
