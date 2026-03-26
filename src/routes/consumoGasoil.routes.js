import { Router } from "express";
import {
  obtenerConsumoGasoil,
  guardarConsumoGasoil,
} from "../controllers/consumoGasoil.controller.js";

const router = Router();

router.get("/", obtenerConsumoGasoil);
router.put("/", guardarConsumoGasoil);

export default router;
