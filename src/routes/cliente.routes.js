import { Router } from "express";
import {
  crearCliente,
  obtenerClientes,
  editarCliente,
  eliminarCliente
} from "../controllers/cliente.controller.js";

const router = Router();

router.get("/", obtenerClientes);
router.post("/", crearCliente);
router.put("/:id", editarCliente);
router.delete("/:id", eliminarCliente);

export default router;
