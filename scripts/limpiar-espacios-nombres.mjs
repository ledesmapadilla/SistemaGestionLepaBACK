// Migración única: saca los espacios sobrantes (al principio, al final y
// dobles) de los campos que son nombres y se usan para cruzar datos entre
// colecciones. Los textos libres (observaciones, descripciones) no se tocan.
// Desde ahora el backend ya guarda todo recortado (src/server/textos.js).
//
// Uso (desde la carpeta del backend):  node --env-file=.env scripts/limpiar-espacios-nombres.mjs
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGODB);
const db = mongoose.connection.db;
const limpio = (s) => s.replace(/\s+/g, " ").trim();
const re = /^\s|\s$|\s{2,}/;

// razonsocial de clientes es única: si al limpiar chocara con otro, se aborta.
for (const c of await db.collection("clientes").find({ razonsocial: re }).toArray()) {
  const dup = await db.collection("clientes").findOne({ razonsocial: limpio(c.razonsocial), _id: { $ne: c._id } });
  if (dup) {
    console.log("Cliente duplicado al limpiar, no se cambia nada:", JSON.stringify(c.razonsocial));
    process.exit(1);
  }
}

const campos = [
  ["clientes", "razonsocial"],
  ["proveedores", "razonsocial"],
  ["obras", "razonsocial"],
  ["obras", "nombreobra"],
  ["obras", "contacto"],
  ["cobros", "cliente"],
  ["facturas", "cliente"],
  ["cargagasoils", "cliente"],
  ["cargagasoils", "obra"],
  ["maquinas", "maquina"],
  ["maquinas", "marca"],
  ["gastos", "item"],
];
for (const [col, campo] of campos) {
  let n = 0;
  for (const d of await db.collection(col).find({ [campo]: re }).toArray()) {
    console.log(`  ${col}.${campo}: ${JSON.stringify(d[campo])} → ${JSON.stringify(limpio(d[campo]))}`);
    await db.collection(col).updateOne({ _id: d._id }, { $set: { [campo]: limpio(d[campo]) } });
    n++;
  }
  console.log(`${col}.${campo}: ${n} corregidos`);
}

// Nombres de proveedores dentro de los gastos semanales (array).
let n = 0;
for (const d of await db.collection("gastosemanals").find({ "proveedores.proveedor": re }).toArray()) {
  const proveedores = d.proveedores.map((p) =>
    typeof p.proveedor === "string" ? { ...p, proveedor: limpio(p.proveedor) } : p
  );
  await db.collection("gastosemanals").updateOne({ _id: d._id }, { $set: { proveedores } });
  n++;
}
console.log(`gastosemanals.proveedores[].proveedor: ${n} documentos corregidos`);

await mongoose.disconnect();
