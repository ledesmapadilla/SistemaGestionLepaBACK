import { Router } from "express";
import { crearUsuario, obtenerUsuarios, editarUsuario, eliminarUsuario, verificarAcceso, loginUsuario } from "../controllers/usuario.controller.js";

const router = Router();

router.post("/login", loginUsuario);
router.post("/verificar-acceso", verificarAcceso);
router.post("/", crearUsuario);
router.get("/", obtenerUsuarios);
router.put("/:id", editarUsuario);
router.delete("/:id", eliminarUsuario);

export default router;
