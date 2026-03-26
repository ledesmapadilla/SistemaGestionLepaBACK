import mongoose from "mongoose";

const gastoSchema = new mongoose.Schema(
  {
    obra: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Obra",
      required: true 
    },
    remito: {
      type: String,
      default: "-"
    },
    item: {
      type: String,
      required: true
    },
    cantidad: {
      type: Number,
      required: true,
      min: 0
    },
    unidad: {
      type: String,
      required: true
    },
    costoUnitario: {
      type: Number,
      required: true,
      min: 0
    },
    costoTotal: {
      type: Number,
      default: 0
    },
    observaciones: {
      type: String
    }
  },
  { timestamps: true }
);



export default mongoose.model("Gasto", gastoSchema);