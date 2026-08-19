import { Router } from "express";
import {
  obtenerOpcionesGasoil,
  obtenerCargasGasoilDelMes,
} from "../controllers/publicoGasoil.controller.js";
import { crearCargaGasoil } from "../controllers/cargaGasoil.controller.js";

// Rutas SIN token, para la página /gasoil/carga que se usa desde el celular.
// A propósito solo hay lectura acotada y alta: no se expone el listado completo
// de cargas, ni edición, ni borrado. /mes devuelve nada más que fecha y máquina.
// Todo lo demás sigue detrás del login en /api/cargas-gasoil.
const router = Router();

router.get("/opciones", obtenerOpcionesGasoil);
router.get("/mes", obtenerCargasGasoilDelMes);
router.post("/carga", crearCargaGasoil);

export default router;
