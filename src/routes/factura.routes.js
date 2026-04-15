import { Router } from "express";
import {
  obtenerFacturas,
  crearFactura,
  editarFactura,
  eliminarFactura,
} from "../controllers/factura.controller.js";

const router = Router();

router.get("/", obtenerFacturas);
router.post("/", crearFactura);
router.put("/:id", editarFactura);
router.delete("/:id", eliminarFactura);

export default router;
