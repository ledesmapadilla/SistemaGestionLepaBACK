import mongoose from "mongoose";

// Cada filtro se consigue en varias marcas y cada marca tiene su propio código,
// por eso se guarda una lista de pares marca/código por tipo de filtro.
const itemFiltroSchema = new mongoose.Schema(
  {
    marca:  { type: String, trim: true, default: "" },
    codigo: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// Un documento por máquina, con los cuatro tipos de filtro que usa.
const filtroMaquinaSchema = new mongoose.Schema(
  {
    maquina:       { type: mongoose.Schema.Types.ObjectId, ref: "Maquina", required: true, unique: true },
    aceite:        { type: [itemFiltroSchema], default: [] },
    combustible:   { type: [itemFiltroSchema], default: [] },
    trampaAgua:    { type: [itemFiltroSchema], default: [] },
    hidraulico:    { type: [itemFiltroSchema], default: [] },
    observaciones: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("FiltroMaquina", filtroMaquinaSchema);
