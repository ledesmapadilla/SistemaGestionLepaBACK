import { Router } from "express";
import { crearChequePropio, obtenerChequesPropios, editarChequePropio, eliminarChequePropio } from "../controllers/chequePropio.controller.js";

const router = Router();

router.post("/", crearChequePropio);
router.get("/", obtenerChequesPropios);
router.put("/:id", editarChequePropio);
router.delete("/:id", eliminarChequePropio);

export default router;
