import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import { lastDbError, getDbConnection } from "./server/dbConfig.js";
import router from "./routes/index.routes.js";
import RegistroBateria from "./models/registroBateria.js";

// Cuando la DB conecte, sincronizar índices para eliminar índices obsoletos
// (ej.: bateria_1 unique que quedó de una versión anterior del schema)
mongoose.connection.once("open", () => {
  RegistroBateria.syncIndexes()
    .then(() => console.info("[APP] RegistroBateria.syncIndexes() OK — índices stale eliminados"))
    .catch((e) => console.warn("[APP] syncIndexes warning:", e.message));
});

console.info("[APP] Inicializando Express...");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ── Health check público (sin token) ─────────────────────────────────────────
const DB_STATES = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };

app.get("/api/health", (_req, res) => {
  const state = mongoose.connection.readyState;
  const uri = process.env.MONGODB ?? "";
  const uriSanitized = uri
    ? uri.replace(/:\/\/([^:]+):([^@]+)@/, "://<user>:<pass>@")
    : "(no configurada)";
  res.json({
    status: "ok",
    mongodb: DB_STATES[state] ?? "unknown",
    mongoState: state,
    lastDbError,
    uriSanitized,
    env: {
      MONGODB: !!process.env.MONGODB,
      JWT_SECRET: !!process.env.JWT_SECRET,
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── Guard: conectar a MongoDB y esperar antes de procesar el request ─────────
app.use("/api", async (req, res, next) => {
  console.info(`[APP] Request: ${req.method} ${req.path} — esperando DB...`);
  const t0 = Date.now();
  try {
    await getDbConnection();
    console.info(`[APP] DB lista en ${Date.now() - t0}ms — procesando ${req.method} ${req.path}`);
    next();
  } catch (err) {
    const state = mongoose.connection.readyState;
    console.error(`[APP] DB falló en ${Date.now() - t0}ms (state=${state}): ${req.method} ${req.path} — ${err.message}`);
    return res.status(503).json({
      msg: "Base de datos no disponible",
      error: err.message,
      mongoState: state,
      mongoStateName: DB_STATES[state] ?? "unknown",
    });
  }
}, router);

// ── Error handler global ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[APP] Error no capturado:", err.message, err.stack);
  res.status(500).json({ msg: "Error interno del servidor", error: err.message });
});

console.info("[APP] Express configurado. Rutas montadas en /api");

export default app;
