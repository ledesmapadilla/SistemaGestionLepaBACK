import { Router } from "express";
import {
  obtenerPagosProveedores,
  crearPagoProveedor,
  crearPagoEfectivoProveedor,
  editarPagoProveedor,
  eliminarPagoProveedor,
} from "../controllers/pagoProveedor.controller.js";

const router = Router();

router.get("/", obtenerPagosProveedores);
router.post("/efectivo", crearPagoEfectivoProveedor);
router.post("/", crearPagoProveedor);
router.put("/:id", editarPagoProveedor);
router.delete("/:id", eliminarPagoProveedor);

export default router;
