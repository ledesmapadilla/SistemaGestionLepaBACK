import { Router } from "express";
import {
  crearEntregaEPP,
  obtenerEntregasEPP,
  editarEntregaEPP,
  eliminarEntregaEPP,
} from "../controllers/entregaEPP.controller.js";

const router = Router();

router.post("/", crearEntregaEPP);
router.get("/", obtenerEntregasEPP);
router.put("/:id", editarEntregaEPP);
router.delete("/:id", eliminarEntregaEPP);

export default router;
