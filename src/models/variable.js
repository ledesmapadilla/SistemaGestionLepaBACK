import mongoose from "mongoose";

const variableSchema = new mongoose.Schema(
  {
    variable: {
      type: String,
      required: true,
    },
    historial: [
      {
        valor: { type: Number, required: true },
        fecha: { type: String },
        observaciones: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Variable", variableSchema);
