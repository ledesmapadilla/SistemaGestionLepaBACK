import { Router } from "express";
import { crearUsuario, obtenerUsuarios, editarUsuario, eliminarUsuario } from "../controllers/usuario.controller.js";

// ABM de usuarios: todo pide token. El login y verificar-acceso están en
// usuarioPublico.routes.js, que se monta antes del verificarToken.
const router = Router();

router.post("/", crearUsuario);
router.get("/", obtenerUsuarios);
router.put("/:id", editarUsuario);
router.delete("/:id", eliminarUsuario);

export default router;
