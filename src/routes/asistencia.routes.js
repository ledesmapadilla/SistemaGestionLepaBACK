import { Router } from "express";
import { obtenerAsistencia, guardarAsistencia, eliminarAsistencia, eliminarPersonalDeAsistencias } from "../controllers/asistencia.controller.js";

const router = Router();

router.get("/", obtenerAsistencia);
router.post("/", guardarAsistencia);
router.delete("/personal", eliminarPersonalDeAsistencias);
router.delete("/:id", eliminarAsistencia);

export default router;
