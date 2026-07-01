import { Router } from "express";
import { obtenerTodosPendientes, guardarPendientes } from "../controllers/pendienteResponsable.controller.js";

const router = Router();

router.get("/", obtenerTodosPendientes);
router.post("/", guardarPendientes);

export default router;
