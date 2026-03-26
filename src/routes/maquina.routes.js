import { Router } from "express";
import { crearMaquina, obtenerMaquinas, editarMaquina, eliminarMaquina  } from "../Controllers/maquina.controller.js";


const router = Router();


router.post("/", crearMaquina);
router.get("/", obtenerMaquinas);
router.put("/:id", editarMaquina);
router.delete("/:id", eliminarMaquina);

export default router;
