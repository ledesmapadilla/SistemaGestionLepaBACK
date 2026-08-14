// Pasa el `costoHoraPersonal` de los ítems de remito al criterio nuevo:
// el semanal se reparte en los jornales de la persona (semanal/cantJornales/8)
// y no en 44 hs fijas. Solo toca remitos de obras con estado "En curso".
//
//   node --env-file .env scratch/migrar_costo_hora.js           -> simulacro
//   node --env-file .env scratch/migrar_costo_hora.js --aplicar -> escribe
//
// Reajusta el valor ya congelado por el factor 44 / (cantJornales * 8), así se
// conserva el sueldo con el que se emitió cada remito. Quien tiene 5.5 jornales
// no cambia (44 = 5.5 * 8); quien tiene 5 sube 10%.
//
// Antes de escribir guarda scratch/backup_costo_hora.json con los valores
// viejos, para poder revertir.
import mongoose from "mongoose";
import { writeFileSync } from "fs";

const APLICAR = process.argv.includes("--aplicar");
const JORNALES_POR_DEFECTO = 5.5;
const DIVISOR_VIEJO = 44;

const norm = (s) => (s || "").trim().toLowerCase();

// Misma lógica que helpers/semanalUtils.js del frontend.
const semanalVigente = (semanal, fechaRef) => {
  if (!Array.isArray(semanal) || semanal.length === 0) return null;
  const ordenado = [...semanal].sort((a, b) =>
    String(a.fecha || "").localeCompare(String(b.fecha || ""))
  );
  if (!fechaRef) return ordenado[ordenado.length - 1];
  let elegido = null;
  for (const item of ordenado) {
    if (String(item.fecha || "") <= fechaRef) elegido = item;
  }
  return elegido || ordenado[0];
};

const jornalesVigente = (semanal, fechaRef) => {
  const cant = Number(semanalVigente(semanal, fechaRef)?.cantJornales || 0);
  if (cant > 0) return cant;
  const conJornales = (Array.isArray(semanal) ? semanal : [])
    .map((s) => Number(s?.cantJornales || 0))
    .filter((c) => c > 0);
  return conJornales.length > 0 ? conJornales[0] : JORNALES_POR_DEFECTO;
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB);
  const db = mongoose.connection.db;

  const obras = await db.collection("obras").find({ estado: "En curso" }).toArray();
  const obrasPorId = new Map(obras.map((o) => [String(o._id), o.nombreobra]));
  console.log(`Obras "En curso": ${obras.length}`);

  const personal = await db.collection("personals").find({}).toArray();
  const personalPorNombre = new Map(personal.map((p) => [norm(p.nombre), p]));

  const remitos = await db
    .collection("remitos")
    .find({ obra: { $in: obras.map((o) => o._id) } })
    .toArray();
  console.log(`Remitos de esas obras: ${remitos.length}`);

  const cambios = [];
  const backup = [];

  for (const r of remitos) {
    let tocado = false;
    const items = (r.items || []).map((it, idx) => {
      if (!it.personal) return it;
      const viejo = Number(it.costoHoraPersonal || 0);
      if (viejo <= 0) return it;
      const emp = personalPorNombre.get(norm(it.personal));
      if (!emp) return it;
      // Guarda de idempotencia: solo se convierte lo que todavía está en el
      // criterio viejo, es decir cuando `viejo * 44` cae en algún sueldo del
      // historial de la persona. Si ya se convirtió, ese producto no coincide
      // con ningún sueldo y el ítem se saltea (correr dos veces no duplica).
      const sueldos = (Array.isArray(emp.semanal) ? emp.semanal : []).map((s) => Number(s.valor) || 0);
      const semanalCongelado = viejo * DIVISOR_VIEJO;
      if (!sueldos.some((v) => Math.abs(v - semanalCongelado) <= 1)) return it;
      const cant = jornalesVigente(emp.semanal, it.fecha || r.fecha);
      const nuevo = Math.round(viejo * (DIVISOR_VIEJO / (cant * 8)) * 100) / 100;
      if (nuevo === viejo) return it;
      tocado = true;
      cambios.push({
        obra: obrasPorId.get(String(r.obra)),
        remito: r.remito,
        item: idx,
        fecha: it.fecha || r.fecha,
        personal: it.personal,
        cantJornales: cant,
        viejo,
        nuevo,
        cantidad: Number(it.cantidad || 0),
      });
      backup.push({ remitoId: String(r._id), item: idx, costoHoraPersonal: viejo });
      return { ...it, costoHoraPersonal: nuevo };
    });
    if (tocado && APLICAR) {
      await db.collection("remitos").updateOne({ _id: r._id }, { $set: { items } });
    }
  }

  console.log(`\nÍtems a recalcular: ${cambios.length}`);
  const porPersona = {};
  cambios.forEach((c) => {
    const k = `${c.personal} [${c.cantJornales} jornales] ${c.viejo} -> ${c.nuevo}`;
    if (!porPersona[k]) porPersona[k] = { items: 0, horas: 0, difPlata: 0 };
    porPersona[k].items++;
    porPersona[k].horas += c.cantidad;
    porPersona[k].difPlata += c.cantidad * (c.nuevo - c.viejo);
  });
  Object.entries(porPersona).forEach(([k, v]) => {
    console.log(`  ${k}: ${v.items} ítems, ${v.horas} hs, dif $${Math.round(v.difPlata).toLocaleString("es-AR")}`);
  });

  const porObra = {};
  cambios.forEach((c) => {
    if (!porObra[c.obra]) porObra[c.obra] = { items: 0, difPlata: 0 };
    porObra[c.obra].items++;
    porObra[c.obra].difPlata += c.cantidad * (c.nuevo - c.viejo);
  });
  console.log("\nPor obra:");
  Object.entries(porObra).forEach(([o, v]) =>
    console.log(`  ${o}: ${v.items} ítems, dif $${Math.round(v.difPlata).toLocaleString("es-AR")}`)
  );

  if (APLICAR) {
    writeFileSync("scratch/backup_costo_hora.json", JSON.stringify(backup, null, 2));
    console.log(`\nAPLICADO. Backup en scratch/backup_costo_hora.json (${backup.length} ítems).`);
  } else {
    console.log("\nSIMULACRO — no se escribió nada. Correr con --aplicar para guardar.");
  }

  await mongoose.disconnect();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
