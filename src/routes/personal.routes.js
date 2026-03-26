import { Router } from "express";
import { crearPersonal, obtenerPersonal, editarPersonal, eliminarPersonal  } from "../Controllers/personal.controller.js";


const router = Router();


router.post("/", crearPersonal);
router.get("/", obtenerPersonal);
router.put("/:id", editarPersonal);
router.delete("/:id", eliminarPersonal);

export default router;
