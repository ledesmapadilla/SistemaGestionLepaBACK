import { Router } from "express";
import { obtenerCuentaCorriente } from "../controllers/cuentaCorriente.controller.js";

const router = Router();

router.get("/", obtenerCuentaCorriente);

export default router;
