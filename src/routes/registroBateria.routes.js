import { Router } from "express";
import { crearRegistro, obtenerRegistros, obtenerHistorial, editarRegistro, eliminarRegistro } from "../controllers/registroBateria.controller.js";

const router = Router();

router.post("/", crearRegistro);
router.get("/", obtenerRegistros);
router.get("/:id/historial", obtenerHistorial);
router.put("/:id", editarRegistro);
router.delete("/:id", eliminarRegistro);

export default router;
