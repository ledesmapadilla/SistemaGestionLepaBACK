import { Router } from "express";
import { obtenerCobros, crearCobro, editarCobro, eliminarCobro, recalcularTodasLasFacturas, actualizarEstadoMedioPago } from "../controllers/cobro.controller.js";

const router = Router();

router.get("/recalcular-todo", recalcularTodasLasFacturas);
router.get("/", obtenerCobros);
router.post("/", crearCobro);
router.put("/:id", editarCobro);
router.delete("/:id", eliminarCobro);
router.patch("/:cobroId/medio/:medioIndex", actualizarEstadoMedioPago);

export default router;
