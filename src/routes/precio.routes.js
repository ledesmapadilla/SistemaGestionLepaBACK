import { Router } from "express";
import {
  crearPrecio,
  obtenerPrecios,
  editarPrecio,
  eliminarPrecio,
} from "../controllers/precio.controller.js";

const router = Router();

router.get("/", obtenerPrecios);
router.post("/", crearPrecio);
router.put("/:id", editarPrecio);
router.delete("/:id", eliminarPrecio);

export default router;
