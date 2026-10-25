import { Router } from "express";
import {
  obtenerPagosProveedores,
  crearPagoProveedor,
  crearPagoEfectivoProveedor,
  editarPagoProveedor,
  eliminarPagoProveedor,
  obtenerDevolucionesProveedores,
  crearDevolucionProveedor,
  eliminarDevolucionProveedor,
} from "../controllers/pagoProveedor.controller.js";

const router = Router();

router.get("/", obtenerPagosProveedores);
router.get("/devoluciones", obtenerDevolucionesProveedores);
router.post("/devoluciones", crearDevolucionProveedor);
router.delete("/devoluciones/:id", eliminarDevolucionProveedor);
router.post("/efectivo", crearPagoEfectivoProveedor);
router.post("/", crearPagoProveedor);
router.put("/:id", editarPagoProveedor);
router.delete("/:id", eliminarPagoProveedor);

export default router;
