import { Router } from "express";
import { obtenerReparacionesPorMaquina, guardarReparaciones } from "../controllers/reparacionMaquina.controller.js";

const router = Router();

router.get("/:maquinaId", obtenerReparacionesPorMaquina);
router.post("/", guardarReparaciones);

export default router;
