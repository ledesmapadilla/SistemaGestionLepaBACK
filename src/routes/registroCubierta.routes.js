import { Router } from "express";
import { crearRegistro, obtenerRegistros, editarRegistro, eliminarRegistro } from "../controllers/registroCubierta.controller.js";

const router = Router();

router.post("/", crearRegistro);
router.get("/", obtenerRegistros);
router.put("/:id", editarRegistro);
router.delete("/:id", eliminarRegistro);

export default router;
