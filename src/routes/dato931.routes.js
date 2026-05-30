import { Router } from "express";
import { obtenerDatos931, guardarDato931, eliminarDato931 } from "../controllers/dato931.controller.js";

const router = Router();

router.get("/", obtenerDatos931);
router.post("/", guardarDato931);
router.delete("/:id", eliminarDato931);

export default router;
