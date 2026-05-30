import { Router } from "express";
import { crearCubierta, obtenerCubiertas, editarCubierta, eliminarCubierta } from "../controllers/cubierta.controller.js";

const router = Router();

router.post("/", crearCubierta);
router.get("/", obtenerCubiertas);
router.put("/:id", editarCubierta);
router.delete("/:id", eliminarCubierta);

export default router;
