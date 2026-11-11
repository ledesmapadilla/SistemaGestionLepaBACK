// Diagnóstico solo lectura: cobros y facturas de Momba.
import mongoose from "mongoose";
import Cobro from "../src/models/cobro.js";
import Factura from "../src/models/factura.js";
import { recibidoCobro, imputadoCobro } from "../src/helpers/saldoAFavor.js";
await mongoose.connect(process.env.MONGODB);
const re = /momba/i;
const facturas = await Factura.find({ cliente: re }, "fecha tipoFactura numeroFactura cliente total estadoPago facturaAsociada").sort({ fecha: 1 }).lean();
const cobros = await Cobro.find({ cliente: re }).sort({ fecha: 1 }).lean();
const cob = {};
for (const c of cobros) for (const p of c.pagos || []) cob[p.factura] = (cob[p.factura] || 0) + p.montoCobrado;
const r = (n) => Math.round(n * 100) / 100;
console.log("== Facturas ==");
for (const f of facturas) {
  const t = f.tipoFactura === "Factura X" ? f.total : f.total * 1.21;
  console.log(f.fecha, f.cliente, f.tipoFactura, f.numeroFactura, f.estadoPago, "total", r(t), "cobrado", r(cob[f._id] || 0), "saldo", r(t - (cob[f._id] || 0)), f.facturaAsociada || "");
}
console.log("== Cobros ==");
let pool = 0;
for (const c of cobros) {
  const rec = recibidoCobro(c), imp = imputadoCobro(c); pool += rec - imp;
  console.log(c._id.toString(), c.fecha, c.cliente, c.origen, "recibido", r(rec), "imputado", r(imp), "excedente", r(rec - imp), (c.mediosPago||[]).map(m=>m.medioPago+":"+m.monto).join(","), "pagos", (c.pagos||[]).length);
}
console.log("Saldo a favor total:", r(pool));
await mongoose.disconnect();
