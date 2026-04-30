import { Router } from "express";
import { obtenerAsistencia, guardarAsistencia, eliminarAsistencia } from "../controllers/asistencia.controller.js";

const router = Router();

router.get("/", obtenerAsistencia);
router.post("/", guardarAsistencia);
router.delete("/:id", eliminarAsistencia);

export default router;
