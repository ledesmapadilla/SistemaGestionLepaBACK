// Solo lectura: compara saldo de cuenta corriente vs suma de facturas impagas.
import mongoose from "mongoose";
import Cobro, { PROVEEDOR_FUERA } from "../src/models/cobro.js";
import Factura from "../src/models/factura.js";
import { recibidoCobro, imputadoCobro } from "../src/helpers/saldoAFavor.js";
import { regexTexto } from "../src/helpers/textoFlexible.js";
await mongoose.connect(process.env.MONGODB);
const cli = process.argv[2] || "Momba";
const f = await Factura.find({ cliente: regexTexto(cli) }).lean();
const c = await Cobro.find({ cliente: regexTexto(cli), ...PROVEEDOR_FUERA }).lean();
const tot = (x) => (x.tipoFactura === "Factura X" ? x.total : x.total * 1.21);
const debito = f.filter((x) => x.tipoFactura !== "Nota de Crédito").reduce((s, x) => s + tot(x), 0);
const credNC = f.filter((x) => x.tipoFactura === "Nota de Crédito").reduce((s, x) => s + Math.abs(tot(x)), 0);
const recibido = c.reduce((s, x) => s + recibidoCobro(x), 0);
const imputado = c.reduce((s, x) => s + imputadoCobro(x), 0);
const cob = {}; for (const x of c) for (const p of x.pagos || []) cob[p.factura] = (cob[p.factura] || 0) + p.montoCobrado;
let impagas = 0, exceso = 0;
for (const x of f) {
  if (x.tipoFactura === "Nota de Crédito") continue;
  const s = tot(x) - (cob[x._id] || 0);
  if (x.estadoPago === "Anulada") { console.log("Anulada:", x.numeroFactura, tot(x)); continue; }
  if (s > 0.01) impagas += s; else if (s < -0.01) { exceso += -s; console.log("Cobrada de más:", x.tipoFactura, x.numeroFactura, -s); }
}
const fmt = (n) => n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
console.log({ debito: fmt(debito), credNC: fmt(credNC), recibido: fmt(recibido), imputado: fmt(imputado) });
console.log("Saldo cta cte:", fmt(debito - credNC - recibido));
console.log("Facturas impagas:", fmt(impagas));
console.log("Diferencia:", fmt(impagas - (debito - credNC - recibido)));
console.log("  saldo a favor sin imputar (recibido - imputado):", fmt(recibido - imputado));
console.log("  facturas cobradas de más:", fmt(exceso));
await mongoose.disconnect();
