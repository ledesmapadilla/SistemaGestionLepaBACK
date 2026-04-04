import { Router } from "express";
import {
  crearObra,
  obtenerObras,
  obtenerObraPorId,
  editarObra,
  eliminarObra,
} from "../controllers/obra.controller.js";
const router = Router();

router.get("/", obtenerObras);
router.get("/:id", obtenerObraPorId);
router.post("/", crearObra);
router.put("/:id", editarObra);
router.delete("/:id", eliminarObra);
export default router;
