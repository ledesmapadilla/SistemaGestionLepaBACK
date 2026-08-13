import { Router } from "express";
import { verificarAcceso, loginUsuario } from "../controllers/usuario.controller.js";

// Lo único de /usuarios que puede ir sin token: no se puede pedir el token
// estando logueado. El ABM de usuarios va en usuario.routes.js, detrás del
// verificarToken.
const router = Router();

router.post("/login", loginUsuario);
router.post("/verificar-acceso", verificarAcceso);

export default router;
