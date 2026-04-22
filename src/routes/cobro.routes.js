import { Router } from "express";
import { obtenerCobros, crearCobro, editarCobro, eliminarCobro } from "../controllers/cobro.controller.js";

const router = Router();

router.get("/", obtenerCobros);
router.post("/", crearCobro);
router.put("/:id", editarCobro);
router.delete("/:id", eliminarCobro);

export default router;
