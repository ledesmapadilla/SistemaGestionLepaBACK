// Diagnóstico (solo lectura): cobros donde lo recibido ≠ lo imputado y facturas sobrepagadas.
import mongoose from "mongoose";
import Cobro from "../src/models/cobro.js";
import Factura from "../src/models/factura.js";

await mongoose.connect(process.env.MONGODB);
const cobros = await Cobro.find().lean();
const facturas = await Factura.find({}, "tipoFactura total numeroFactura cliente estadoPago").lean();
const fMap = Object.fromEntries(facturas.map((f) => [f._id.toString(), f]));
const r2 = (n) => Math.round(n * 100) / 100;

console.log("Cobros:", cobros.length);
console.log("\n== Cobros con recibido ≠ imputado ==");
for (const c of cobros) {
  const imputado = (c.pagos || []).reduce((s, p) => s + (p.montoCobrado || 0), 0);
  if (!c.mediosPago?.length) continue;
  const recibido = c.mediosPago.reduce((s, m) => s + (m.monto || 0), 0);
  if (Math.abs(recibido - imputado) > 0.01)
    console.log(c._id.toString(), c.fecha, c.cliente, "recibido", r2(recibido), "imputado", r2(imputado));
}
console.log("\nCobros sin mediosPago (legacy):", cobros.filter((c) => !c.mediosPago?.length).length);

console.log("\n== Facturas sobrepagadas ==");
const cobrado = {};
for (const c of cobros) for (const p of c.pagos || []) {
  const id = p.factura?.toString(); if (id) cobrado[id] = (cobrado[id] || 0) + (p.montoCobrado || 0);
}
for (const [id, tot] of Object.entries(cobrado)) {
  const f = fMap[id]; if (!f) { console.log("factura inexistente", id, tot); continue; }
  const total = f.tipoFactura === "Factura X" ? f.total : f.total * 1.21;
  if (tot > total + 0.01) console.log(f.cliente, f.tipoFactura, f.numeroFactura, "total", r2(total), "cobrado", r2(tot), "exceso", r2(tot - total));
}
await mongoose.disconnect();
