import { Router } from "express";
import { obtenerDatos, guardarDato, agregarHistorial, eliminarDato } from "../controllers/datoImpuesto.controller.js";

const router = Router();

router.get("/", obtenerDatos);
router.post("/", guardarDato);
router.post("/historial", agregarHistorial);
router.delete("/:id", eliminarDato);

export default router;
