// Momba 2026-11-11: backup de todos sus cobros antes de corregir.
// La corrección en sí fue: migrar_saldo_a_favor.js --aplicar (facturas 10 y 20)
// + imputarSaldoAFavorAlFacturar("Momba", "2026-11-11") → Factura X 25.
import mongoose from "mongoose";
import fs from "node:fs";
import Cobro from "../src/models/cobro.js";
import { regexTexto } from "../src/helpers/textoFlexible.js";
await mongoose.connect(process.env.MONGODB);
const cobros = await Cobro.find({ cliente: regexTexto("Momba") }).lean();
fs.writeFileSync("scratch/backup_cobros_momba_20261111.json", JSON.stringify(cobros, null, 2));
console.log("backup:", cobros.length, "cobros");
await mongoose.disconnect();
