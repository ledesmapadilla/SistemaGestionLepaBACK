// Script de migración: convertir semanal de Number a [{valor, fecha}]
// Correr UNA SOLA VEZ: node --env-file .env migrarSemanal.js
import mongoose from "mongoose";

const MONGODB = process.env.MONGODB;

async function migrar() {
  await mongoose.connect(MONGODB);
  console.log("Conectado a MongoDB");

  const db = mongoose.connection.db;
  const collection = db.collection("personals");

  // Buscar registros donde semanal es número (no array)
  const registros = await collection
    .find({ semanal: { $type: "number" } })
    .toArray();

  console.log(`Registros a migrar: ${registros.length}`);

  for (const reg of registros) {
    const hoy = new Date().toISOString().slice(0, 10);
    await collection.updateOne(
      { _id: reg._id },
      { $set: { semanal: [{ valor: reg.semanal, fecha: hoy }] } }
    );
    console.log(`Migrado: ${reg.nombre} (semanal: ${reg.semanal})`);
  }

  console.log("Migración completada");
  await mongoose.disconnect();
}

migrar().catch((err) => {
  console.error("Error en migración:", err);
  process.exit(1);
});
