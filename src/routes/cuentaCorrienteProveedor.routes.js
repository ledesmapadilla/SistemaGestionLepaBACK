import { Router } from "express";
import { obtenerCuentaCorrienteProveedor } from "../controllers/cuentaCorrienteProveedor.controller.js";

const router = Router();

router.get("/", obtenerCuentaCorrienteProveedor);

export default router;
