import { Router } from "express";
import { obtenerTablero } from "../controllers/tablero.controller.js";

const router = Router();

router.get("/", obtenerTablero);

export default router;
