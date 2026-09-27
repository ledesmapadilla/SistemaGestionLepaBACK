import { Router } from "express";
import {
  obtenerPendientesReunion,
  crearPendienteReunion,
  editarPendienteReunion,
  borrarPendienteReunion,
} from "../controllers/pendienteReunion.controller.js";

const router = Router();

router.get("/", obtenerPendientesReunion);
router.post("/", crearPendienteReunion);
router.put("/:id", editarPendienteReunion);
router.delete("/:id", borrarPendienteReunion);

export default router;
