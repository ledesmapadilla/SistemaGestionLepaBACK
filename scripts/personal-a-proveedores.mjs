// Migración única: da de alta como proveedor (rubro "Personal") a todo el
// personal activo que todavía no lo es. Las altas nuevas de personal ya lo
// hacen solas (crearPersonal -> asegurarProveedorDePersonal).
//
// Uso (desde la carpeta del backend):
//   node --env-file=.env scripts/personal-a-proveedores.mjs            (solo muestra)
//   node --env-file=.env scripts/personal-a-proveedores.mjs --aplicar  (crea)
import mongoose from "mongoose";
import Personal from "../src/models/personal.js";
import Proveedor from "../src/models/proveedor.js";
import { asegurarProveedorDePersonal, esMismaPersona } from "../src/helpers/proveedorDePersonal.js";

const aplicar = process.argv.includes("--aplicar");
await mongoose.connect(process.env.MONGODB);

const activos = await Personal.find({ activo: { $ne: false } }, { nombre: 1 }).lean();
const proveedores = await Proveedor.find({}, { razonsocial: 1 }).lean();

let creados = 0;
for (const p of activos) {
  const ya = proveedores.some((x) => esMismaPersona(x.razonsocial, p.nombre));
  if (ya) {
    console.log(`ya existe   ${p.nombre}`);
    continue;
  }
  if (aplicar) {
    if (await asegurarProveedorDePersonal(p.nombre)) creados++;
    console.log(`creado      ${p.nombre}`);
  } else {
    console.log(`se crearía  ${p.nombre}`);
  }
}

console.log(aplicar ? `\nCreados: ${creados}` : "\nModo prueba: no se creó nada. Correr con --aplicar.");
await mongoose.disconnect();
