import mongoose from "mongoose";

const chequesPropioSchema = new mongoose.Schema(
  {
    numeroCheque: { type: String, required: true, unique: true, trim: true },
    monto:        { type: Number, required: true },
    fechaCobro:   { type: String, required: true },
    proveedor:    { type: String, required: true, trim: true },
    tipo:         { type: String, required: true },
    estado:       { type: String, default: "Emitido" },
  },
  { timestamps: true }
);

export default mongoose.model("ChequePropio", chequesPropioSchema);
