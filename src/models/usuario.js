import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
    },
    usuario: {
      type: String,
      required: true,
      unique: true,
    },
    contrasena: {
      type: String,
      required: true,
    },
    contrasenaVisible: {
      type: String,
    },
    rol: {
      type: String,
      required: true,
      enum: ["superadministrador", "administrador", "operador"],
    },
  },
  { timestamps: true }
);

usuarioSchema.pre("save", async function () {
  // Validar unicidad de usuario
  if (this.isModified("usuario")) {
    const existente = await mongoose.model("Usuario").findOne({
      usuario: this.usuario,
      _id: { $ne: this._id },
    });
    if (existente) {
      const error = new Error("El nombre de usuario ya existe");
      error.code = 11000;
      throw error;
    }
  }

  // Hashear contraseña solo si fue modificada
  if (this.isModified("contrasena")) {
    this.contrasenaVisible = this.contrasena;
    const salt = await bcrypt.genSalt(10);
    this.contrasena = await bcrypt.hash(this.contrasena, salt);
  }
});

export default mongoose.model("Usuario", usuarioSchema);
