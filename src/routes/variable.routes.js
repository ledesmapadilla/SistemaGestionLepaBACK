import { Router } from "express";
import {
  crearVariable,
  obtenerVariables,
  editarVariable,
  eliminarVariable,
} from "../controllers/variable.controller.js";

const router = Router();

router.get("/", obtenerVariables);
router.post("/", crearVariable);
router.put("/:id", editarVariable);
router.delete("/:id", eliminarVariable);

export default router;
