import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import "./server/dbConfig.js";
import router from "./routes/index.routes.js";

console.info("[APP] Inicializando Express...");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ── Health check público (sin token) ─────────────────────────────────────────
const DB_STATES = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };

app.get("/api/health", (_req, res) => {
  const state = mongoose.connection.readyState;
  res.json({
    status: "ok",
    mongodb: DB_STATES[state] ?? "unknown",
    mongoState: state,
    env: {
      MONGODB: !!process.env.MONGODB,
      JWT_SECRET: !!process.env.JWT_SECRET,
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── Guard: abortar inmediatamente si MongoDB no está listo ───────────────────
app.use("/api", (req, res, next) => {
  const state = mongoose.connection.readyState;
  if (state !== 1) {
    console.error(`[APP] Solicitud rechazada (DB state=${state}): ${req.method} ${req.path}`);
    return res.status(503).json({
      msg: "Base de datos no disponible",
      mongoState: state,
      mongoStateName: DB_STATES[state] ?? "unknown",
      hint: "Verificar variable MONGODB en Vercel y Network Access en MongoDB Atlas",
    });
  }
  next();
}, router);

// ── Error handler global ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[APP] Error no capturado:", err.message, err.stack);
  res.status(500).json({ msg: "Error interno del servidor", error: err.message });
});

console.info("[APP] Express configurado. Rutas montadas en /api");

export default app;
