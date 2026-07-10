import mongoose from "mongoose";

const uri = process.env.MONGODB;

export let lastDbError = null;

const CONNECT_OPTS = {
  maxPoolSize: 5,
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 30000,
  bufferCommands: false,
};

let _promise = null;

console.info(`[DB] Módulo cargado. URI presente: ${!!uri}. mongoose version: ${mongoose.version}`);
if (uri) {
  const uriLog = uri.replace(/:\/\/([^:]+):([^@]+)@/, "://<user>:<pass>@");
  console.info(`[DB] URI sanitizada: ${uriLog}`);
  console.info(`[DB] URI length: ${uri.length} | starts: ${uri.substring(0, 14)}`);
}

export function getDbConnection() {
  const state = mongoose.connection.readyState;
  console.info(`[DB] getDbConnection() llamado. readyState=${state} _promise=${!!_promise}`);

  if (!uri) {
    console.error("[DB] FALLO: variable MONGODB no definida");
    return Promise.reject(new Error("Variable MONGODB no configurada"));
  }

  if (state === 1) {
    console.info("[DB] Ya conectada, resolviendo inmediatamente");
    return Promise.resolve();
  }

  if (!_promise) {
    console.info("[DB] Iniciando nueva conexión...");
    const t0 = Date.now();

    _promise = mongoose.connect(uri, CONNECT_OPTS)
      .then(() => {
        lastDbError = null;
        console.info(`[DB] Conectada OK en ${Date.now() - t0}ms. DB: ${mongoose.connection.name}`);
      })
      .catch((err) => {
        lastDbError = `${err.name}: ${err.message}`;
        _promise = null;
        console.error(`[DB] Falló en ${Date.now() - t0}ms. Error: ${lastDbError}`);
        throw err;
      });
  } else {
    console.info("[DB] Reutilizando promesa de conexión en curso...");
  }

  return _promise;
}

mongoose.connection.on("connecting", () => console.info("[DB] evento: connecting"));
mongoose.connection.on("connected", () => console.info("[DB] evento: connected"));
mongoose.connection.on("disconnected", () => {
  _promise = null;
  console.warn("[DB] evento: disconnected — promesa reseteada");
});
mongoose.connection.on("reconnected", () => console.info("[DB] evento: reconnected"));
mongoose.connection.on("error", (err) => {
  lastDbError = err.message;
  console.error(`[DB] evento error: ${err.message}`);
});

// Iniciar la conexión en segundo plano inmediatamente al importar el módulo
getDbConnection().catch((err) => {
  console.error("[DB] Error en la conexión inicial en segundo plano:", err.message);
});

export default mongoose;