import mongoose from "mongoose";

const uri = process.env.MONGODB;

if (!uri) {
  console.error("[DB] CRITICO: variable MONGODB no definida en env.");
} else {
  // Ocultar credenciales en logs
  const uriLog = uri.replace(/:\/\/([^:]+):([^@]+)@/, "://<user>:<pass>@");
  console.info(`[DB] Conectando a: ${uriLog}`);

  mongoose.connect(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 30000,
    family: 4,
  })
    .then(() => {
      console.info(`[DB] Conectada: ${mongoose.connection.name}`);
    })
    .catch((err) => {
      console.error(`[DB] Error de conexión: ${err.name} — ${err.message}`);
    });

  mongoose.connection.on("disconnected", () =>
    console.warn("[DB] Desconectada de MongoDB")
  );
  mongoose.connection.on("reconnected", () =>
    console.info("[DB] Reconectada a MongoDB")
  );
  mongoose.connection.on("error", (err) =>
    console.error(`[DB] Error en conexión activa: ${err.message}`)
  );
}

export default mongoose;