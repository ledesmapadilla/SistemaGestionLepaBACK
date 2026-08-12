import { Router } from "express";
import {
  crearCargaGasoil,
  obtenerCargasGasoil,
  editarCargaGasoil,
  eliminarCargaGasoil,
} from "../controllers/cargaGasoil.controller.js";

const router = Router();

router.post("/", crearCargaGasoil);
router.get("/", obtenerCargasGasoil);
router.put("/:id", editarCargaGasoil);
router.delete("/:id", eliminarCargaGasoil);

export default router;
