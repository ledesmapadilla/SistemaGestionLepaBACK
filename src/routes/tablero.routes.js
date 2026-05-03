import { Router } from "express";
import { obtenerTablero } from "../Controllers/tablero.controller.js";

const router = Router();

router.get("/", obtenerTablero);

export default router;
