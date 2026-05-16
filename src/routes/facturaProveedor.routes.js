import { Router } from "express";
import {
  obtenerFacturasProveedores,
  crearFacturaProveedor,
  editarFacturaProveedor,
  eliminarFacturaProveedor,
} from "../controllers/facturaProveedor.controller.js";

const router = Router();

router.get("/", obtenerFacturasProveedores);
router.post("/", crearFacturaProveedor);
router.put("/:id", editarFacturaProveedor);
router.delete("/:id", eliminarFacturaProveedor);

export default router;
