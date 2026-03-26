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
    telefono: String
  },
  { timestamps: true }
);

export default mongoose.model("Proveedor", proveedorSchema);
