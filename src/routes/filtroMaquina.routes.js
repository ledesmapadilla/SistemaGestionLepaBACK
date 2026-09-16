import { Router } from "express";
import {
  obtenerFiltros,
  guardarFiltro,
  eliminarTipoFiltro,
  eliminarFiltro,
} from "../controllers/filtroMaquina.controller.js";

const router = Router();

router.get("/", obtenerFiltros);
router.post("/", guardarFiltro);
router.delete("/:id/:tipo", eliminarTipoFiltro);
router.delete("/:id", eliminarFiltro);

export default router;
