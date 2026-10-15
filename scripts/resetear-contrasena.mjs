// Asigna una contraseña nueva a un usuario que se olvidó la suya (no se pueden
// recuperar: se guardan hasheadas con bcrypt). Sin argumentos lista los usuarios.
//
// Uso (desde la carpeta del backend):
//   node --env-file=.env scripts/resetear-contrasena.mjs
//   node --env-file=.env scripts/resetear-contrasena.mjs <usuario> <contraseñaNueva>
import mongoose from "mongoose";
import Usuario from "../src/models/usuario.js";

const [usuario, nueva] = process.argv.slice(2);

await mongoose.connect(process.env.MONGODB);

if (!usuario) {
  for (const u of await Usuario.find().select("usuario nombre rol").lean()) {
    console.log(`${u.usuario}  —  ${u.nombre}  (${u.rol})`);
  }
} else if (!nueva) {
  console.log("Falta la contraseña nueva.");
  process.exitCode = 1;
} else {
  const u = await Usuario.findOne({ usuario });
  if (!u) {
    console.log(`No existe el usuario "${usuario}".`);
    process.exitCode = 1;
  } else {
    u.contrasena = nueva; // el pre("save") del modelo la hashea
    await u.save();
    console.log(`Contraseña de "${usuario}" actualizada.`);
  }
}

await mongoose.disconnect();
