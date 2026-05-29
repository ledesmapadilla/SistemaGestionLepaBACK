import { Router } from "express";
import { obtenerAsistencia, guardarAsistencia, eliminarAsistencia, eliminarPersonalDeAsistencias, eliminarAsistenciaPorFecha } from "../controllers/asistencia.controller.js";

const router = Router();

router.get("/", obtenerAsistencia);
router.post("/", guardarAsistencia);
router.delete("/personal", eliminarPersonalDeAsistencias);
router.delete("/fecha/:fecha", eliminarAsistenciaPorFecha);
router.delete("/:id", eliminarAsistencia);

export default router;
