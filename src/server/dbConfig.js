import mongoose from "mongoose";

const uri = process.env.MONGODB;

export let lastDbError = null;
export let dbConnectionPromise = null;

if (!uri) {
  console.error("[DB] CRITICO: variable MONGODB no definida en env.");
} else {
  const uriLog = uri.replace(/:\/\/([^:]+):([^@]+)@/, "://<user>:<pass>@");
  console.info(`[DB] Conectando a: ${uriLog}`);

  dbConnectionPromise = mongoose.connect(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });

  dbConnectionPromise
    .then(() => {
      lastDbError = null;
      console.info(`[DB] Conectada: ${mongoose.connection.name}`);
    })
    .catch((err) => {
      lastDbError = `${err.name}: ${err.message}`;
      console.error(`[DB] Error de conexión: ${lastDbError}`);
    });

  mongoose.connection.on("disconnected", () => console.warn("[DB] Desconectada"));
  mongoose.connection.on("reconnected", () => console.info("[DB] Reconectada"));
  mongoose.connection.on("error", (err) => {
    lastDbError = err.message;
    console.error(`[DB] Error activo: ${err.message}`);
  });
}

export default mongoose;