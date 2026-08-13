import { Router } from "express";
import { obtenerOpcionesGasoil } from "../controllers/publicoGasoil.controller.js";
import { crearCargaGasoil } from "../controllers/cargaGasoil.controller.js";

// Rutas SIN token, para la página /gasoil/carga que se usa desde el celular.
// A propósito solo hay lectura de opciones y alta: no se expone el listado de
// cargas, ni edición, ni borrado. Todo eso sigue detrás del login en
// /api/cargas-gasoil.
const router = Router();

router.get("/opciones", obtenerOpcionesGasoil);
router.post("/carga", crearCargaGasoil);

export default router;
