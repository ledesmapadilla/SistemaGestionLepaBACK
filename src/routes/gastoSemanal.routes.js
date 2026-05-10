import { Router } from "express";
import { obtenerGastoSemanal, guardarGastoSemanal } from "../controllers/gastoSemanal.controller.js";

const router = Router();

router.get("/", obtenerGastoSemanal);
router.post("/", guardarGastoSemanal);

export default router;
