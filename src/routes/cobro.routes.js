import { Router } from "express";
import { obtenerCobros, crearCobro, editarCobro, eliminarCobro, recalcularTodasLasFacturas } from "../controllers/cobro.controller.js";

const router = Router();

router.get("/recalcular-todo", recalcularTodasLasFacturas);
router.get("/", obtenerCobros);
router.post("/", crearCobro);
router.put("/:id", editarCobro);
router.delete("/:id", eliminarCobro);

export default router;
