import mongoose from "mongoose";

const bateriaSchema = new mongoose.Schema(
  {
    nombreBateria: { type: String, required: true, unique: true, trim: true },
    marca:         { type: String, required: true },
    fecha:         { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Bateria", bateriaSchema);
