import { Router } from "express";
import { crearService, obtenerServices, editarService, eliminarService } from "../controllers/serviceMaquina.controller.js";

const router = Router();

router.post("/", crearService);
router.get("/", obtenerServices);
router.put("/:id", editarService);
router.delete("/:id", eliminarService);

export default router;
