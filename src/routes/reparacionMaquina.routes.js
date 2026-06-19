import { Router } from "express";
import { obtenerTodasReparaciones, obtenerReparacionesPorMaquina, guardarReparaciones } from "../controllers/reparacionMaquina.controller.js";

const router = Router();

router.get("/", obtenerTodasReparaciones);
router.get("/:maquinaId", obtenerReparacionesPorMaquina);
router.post("/", guardarReparaciones);

export default router;
