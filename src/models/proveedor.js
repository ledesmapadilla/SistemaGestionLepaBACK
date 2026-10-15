import mongoose from "mongoose";

const proveedorSchema = new mongoose.Schema(
  {
     razonsocial: {
      type: String,
      required: true
    },
    contacto: {
      type: String,
      required: true
    },
    rubro: {
      type: String,
      required: true
    },
    cuit: {
      type: String,
      
    },
    email: {
      type: String,
      
    },
    // Opcional: el personal dado de alta como proveedor no tiene teléfono.
    // Único solo cuando está cargado (sparse); el controller nunca guarda "".
    telefono: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
    }
  },
  { timestamps: true }
);

export default mongoose.model("Proveedor", proveedorSchema);
