import { Router } from "express";
import { crearBateria, obtenerBaterias, editarBateria, eliminarBateria } from "../controllers/bateria.controller.js";

const router = Router();

router.post("/", crearBateria);
router.get("/", obtenerBaterias);
router.put("/:id", editarBateria);
router.delete("/:id", eliminarBateria);

export default router;
