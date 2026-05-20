import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import "./server/dbConfig.js";
import router from "./routes/index.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  res.json({
    status: "ok",
    mongodb: states[mongoose.connection.readyState] ?? "unknown",
    env: {
      MONGODB: !!process.env.MONGODB,
      JWT_SECRET: !!process.env.JWT_SECRET,
    },
  });
});

app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      msg: "Base de datos no disponible",
      mongoState: mongoose.connection.readyState,
      hint: "Verificar MONGODB env var y IP whitelist en Atlas",
    });
  }
  next();
}, router);

export default app;
