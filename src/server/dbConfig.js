import mongoose from "mongoose";

const uri = process.env.MONGODB;

export let lastDbError = null;

const CONNECT_OPTS = {
  maxPoolSize: 5,
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 30000,
  bufferCommands: false,
};

// Guarda la promesa activa; se resetea en fallo para que el próximo request reintente.
let _promise = null;

export function getDbConnection() {
  if (!uri) return Promise.reject(new Error("Variable MONGODB no configurada"));

  if (mongoose.connection.readyState === 1) return Promise.resolve();

  if (!_promise) {
    const uriLog = uri.replace(/:\/\/([^:]+):([^@]+)@/, "://<user>:<pass>@");
    console.info(`[DB] Conectando a: ${uriLog}`);

    _promise = mongoose.connect(uri, CONNECT_OPTS)
      .then(() => {
        lastDbError = null;
        console.info(`[DB] Conectada: ${mongoose.connection.name}`);
      })
      .catch((err) => {
        lastDbError = `${err.name}: ${err.message}`;
        _promise = null; // resetear: el próximo request reintenta
        console.error(`[DB] Error de conexión: ${lastDbError}`);
        throw err;
      });
  }

  return _promise;
}

mongoose.connection.on("disconnected", () => {
  _promise = null; // forzar reconexión en el próximo request
  console.warn("[DB] Desconectada");
});
mongoose.connection.on("reconnected", () => console.info("[DB] Reconectada"));
mongoose.connection.on("error", (err) => {
  lastDbError = err.message;
  console.error(`[DB] Error activo: ${err.message}`);
});

export default mongoose;