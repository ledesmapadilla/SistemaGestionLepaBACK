import { Router } from "express";
import {
  crearRemito,
  obtenerRemitos,
  editarRemito,
  eliminarRemito,
  eliminarItemRemito,
  editarItemRemito,
  recalcularEstados,
} from "../controllers/remito.controllers.js";

const router = Router();

router.put("/recalcular-estados", recalcularEstados);
router.get("/", obtenerRemitos);
router.post("/", crearRemito);
router.put("/:remitoId/items/:itemId", editarItemRemito);
router.put("/:id", editarRemito);
router.delete("/:id", eliminarRemito);
router.delete("/:remitoId/items/:itemId", eliminarItemRemito);


export default router;
