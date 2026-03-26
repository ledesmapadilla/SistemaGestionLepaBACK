import { Router } from "express";
import {
  listarAceites,
  crearAceite,
  editarAceite,
  borrarAceite,
  registrarCompra,
  registrarConsumo,
  editarMovimiento,
  borrarMovimiento,
} from "../controllers/aceite.controller.js";

const router = Router();

router.route("/")
  .get(listarAceites)
  .post(crearAceite);

router.route("/:id")
  .put(editarAceite)
  .delete(borrarAceite);

router.post("/compra/:id", registrarCompra);
router.post("/consumo/:id", registrarConsumo);

router.put("/:id/movimiento/:movId", editarMovimiento);
router.delete("/:id/movimiento/:movId", borrarMovimiento);

export default router;
