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
import cuentaCorrienteRoutes from "./cuentaCorriente.routes.js";
import asistenciaRoutes from "./asistencia.routes.js";
import gastoSemanalRoutes from "./gastoSemanal.routes.js";
import serviceMaquinaRoutes from "./serviceMaquina.routes.js";
import tableroRoutes from "./tablero.routes.js";
import facturasProveedoresRoutes from "./facturaProveedor.routes.js";
import pagosProveedoresRoutes from "./pagoProveedor.routes.js";
import cuentaCorrienteProveedorRoutes from "./cuentaCorrienteProveedor.routes.js";
import bateriasRoutes from "./bateria.routes.js";
import registroBateriaRoutes from "./registroBateria.routes.js";
import cubiertasRoutes from "./cubierta.routes.js";
import registroCubiertaRoutes from "./registroCubierta.routes.js";
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
router.use("/cuenta-corriente", cuentaCorrienteRoutes);
router.use("/asistencia", asistenciaRoutes);
router.use("/gasto-semanal", gastoSemanalRoutes);
router.use("/service-maquina", serviceMaquinaRoutes);
router.use("/tablero", tableroRoutes);
router.use("/facturas-proveedores", facturasProveedoresRoutes);
router.use("/pagos-proveedores", pagosProveedoresRoutes);
router.use("/cuenta-corriente-proveedores", cuentaCorrienteProveedorRoutes);
router.use("/baterias", bateriasRoutes);
router.use("/registro-baterias", registroBateriaRoutes);
router.use("/cubiertas", cubiertasRoutes);
router.use("/registro-cubiertas", registroCubiertaRoutes);

export default router;
