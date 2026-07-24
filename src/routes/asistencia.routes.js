import { Router } from "express";
import { obtenerAsistencia, obtenerDatosPantalla, guardarAsistencia, eliminarAsistencia, eliminarPersonalDeAsistencias, eliminarAsistenciaPorFecha } from "../controllers/asistencia.controller.js";

const router = Router();

// Antes de "/" para que no lo capture la ruta genérica.
router.get("/pantalla", obtenerDatosPantalla);
router.get("/", obtenerAsistencia);
router.post("/", guardarAsistencia);
router.delete("/personal", eliminarPersonalDeAsistencias);
router.delete("/fecha/:fecha", eliminarAsistenciaPorFecha);
router.delete("/:id", eliminarAsistencia);

export default router;
