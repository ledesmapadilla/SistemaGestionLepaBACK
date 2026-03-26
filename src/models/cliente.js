import mongoose from "mongoose";

const clienteSchema = new mongoose.Schema(
  {
     razonsocial: {
      type: String,
      required: true,
      unique: true
    },
    contacto: {
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

// normalizar antes de guardar
clienteSchema.pre("save", async function () {
  const existe = await mongoose.models.Cliente.findOne({
    razonsocial: this.razonsocial,
    _id: { $ne: this._id },
  });

  if (existe) {
    throw new Error("La razón social ya existe");
  }
});

export default mongoose.model("Cliente", clienteSchema);
