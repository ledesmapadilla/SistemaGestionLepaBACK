import { Router } from "express";
import {
  crearRemito,
  obtenerRemitos,
  editarRemito,
  eliminarRemito,
  eliminarItemRemito,
  editarItemRemito,
  recalcularEstados,
  existeRemito,
  proximoNumeroRemito,
} from "../controllers/remito.controllers.js";

const router = Router();

router.put("/recalcular-estados", recalcularEstados);
router.get("/existe/:numero", existeRemito);
router.get("/proximo-numero", proximoNumeroRemito);
router.get("/", obtenerRemitos);
router.post("/", crearRemito);
router.put("/:remitoId/items/:itemId", editarItemRemito);
router.put("/:id", editarRemito);
router.delete("/:id", eliminarRemito);
router.delete("/:remitoId/items/:itemId", eliminarItemRemito);


export default router;
