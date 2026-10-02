import { Router } from "express";
import { obtenerTareasSemana, guardarTareasSemana, agregarTareaSemana } from "../controllers/tareaSemana.controller.js";

const router = Router();

router.get("/", obtenerTareasSemana);
router.post("/", guardarTareasSemana);
router.post("/agregar", agregarTareaSemana);

export default router;
