// Facturas cobradas de más (de antes del saldo a favor): baja la imputación al
// saldo real de la factura, en orden cronológico. La plata recibida no cambia,
// así que el excedente pasa a ser saldo a favor del cliente.
// Uso: node --env-file .env scratch/migrar_saldo_a_favor.js           (prueba)
//      node --env-file .env scratch/migrar_saldo_a_favor.js --aplicar (escribe)
import mongoose from "mongoose";
import Cobro from "../src/models/cobro.js";
import Factura from "../src/models/factura.js";

const aplicar = process.argv.includes("--aplicar");
await mongoose.connect(process.env.MONGODB);

const facturas = await Factura.find({}, "tipoFactura total numeroFactura").lean();
const totalMap = Object.fromEntries(
  facturas.map((f) => [f._id.toString(), { f, total: f.tipoFactura === "Factura X" ? f.total : f.total * 1.21 }])
);
const cobros = (await Cobro.find().lean()).sort(
  (a, b) => (a.fecha || "").localeCompare(b.fecha || "") || new Date(a.createdAt) - new Date(b.createdAt)
);

const acumulado = {};
const cambios = [];
for (const c of cobros) {
  let cambio = false;
  const pagos = [];
  for (const p of c.pagos || []) {
    const id = p.factura?.toString();
    const info = totalMap[id];
    if (!info) { pagos.push(p); continue; } // factura borrada: no se toca
    const saldo = Math.max(0, info.total - (acumulado[id] || 0));
    const monto = Math.min(p.montoCobrado, Math.round(saldo * 100) / 100);
    acumulado[id] = (acumulado[id] || 0) + monto;
    if (monto < p.montoCobrado - 0.01) {
      cambio = true;
      console.log(`${c.fecha} ${c.cliente} ${info.f.tipoFactura} N° ${info.f.numeroFactura}: ${p.montoCobrado} → ${monto} (a favor ${p.montoCobrado - monto})`);
    }
    if (monto > 0.01) pagos.push({ ...p, montoCobrado: monto });
  }
  if (cambio) cambios.push({ updateOne: { filter: { _id: c._id }, update: { $set: { pagos } } } });
}

console.log(`\n${cambios.length} cobro(s) a corregir.`);
if (aplicar && cambios.length) {
  await Cobro.bulkWrite(cambios);
  console.log("Aplicado.");
} else if (cambios.length) {
  console.log("Modo prueba: no se escribió nada. Correr con --aplicar para guardar.");
}
await mongoose.disconnect();
