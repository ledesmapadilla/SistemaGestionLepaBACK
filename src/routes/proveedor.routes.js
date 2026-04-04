import { Router } from "express";
import { crearProveedor, obtenerProveedores, editarProveedor, eliminarProveedor  } from "../controllers/proveedor.controller.js";


const router = Router();


router.post("/", crearProveedor);
router.get("/", obtenerProveedores);
router.put("/:id", editarProveedor);
router.delete("/:id", eliminarProveedor);

export default router;
