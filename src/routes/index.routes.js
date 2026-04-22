import { Router } from "express";
import clientesRoutes from "./cliente.routes.js";
import proveedoresRoutes from "./proveedor.routes.js";
import obrasRoutes from "./obra.routes.js";
import remitosRoutes from "./remito.routes.js";
import personalRoutes from "./personal.routes.js";
import maquinaRoutes from "./maquina.routes.js";
import gastosRoutes from "./gasto.routes.js";
import aceitesRoutes from "./aceite.routes.js";
import usuariosRoutes from "./usuario.routes.js";
import variablesRoutes from "./variable.routes.js";
import preciosRoutes from "./precio.routes.js";
import consumoGasoilRoutes from "./consumoGasoil.routes.js";
import facturasRoutes from "./factura.routes.js";
import cobrosRoutes from "./cobro.routes.js";
import verificarToken from "../middleware/auth.middleware.js";

const router = Router();

// Rutas públicas (sin token)
router.use("/usuarios", usuariosRoutes);

// Middleware de autenticación para todo lo demás
router.use(verificarToken);

// Rutas protegidas
router.use("/clientes", clientesRoutes);
router.use("/proveedores", proveedoresRoutes);
router.use("/obras", obrasRoutes);
router.use("/remitos", remitosRoutes);
router.use("/personal", personalRoutes);
router.use("/maquina", maquinaRoutes);
router.use("/gastos", gastosRoutes);
router.use("/aceites", aceitesRoutes);
router.use("/variables", variablesRoutes);
router.use("/precios", preciosRoutes);
router.use("/consumo-gasoil", consumoGasoilRoutes);
router.use("/facturas", facturasRoutes);
router.use("/cobros", cobrosRoutes);

export default router;
