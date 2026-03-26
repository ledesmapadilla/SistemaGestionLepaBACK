import { Router } from "express";
import { 
  crearGasto, 
  obtenerGastos, 
  editarGasto, 
  eliminarGasto  
} from "../Controllers/gasto.controller.js";

const router = Router();

router.post("/", crearGasto);
router.get("/", obtenerGastos);
router.put("/:id", editarGasto);
router.delete("/:id", eliminarGasto);

export default router;