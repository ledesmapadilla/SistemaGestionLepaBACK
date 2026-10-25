import FacturaProveedor from "../models/facturaProveedor.js";
import PagoProveedor from "../models/pagoProveedor.js";
import Cobro from "../models/cobro.js";
import { regexTexto } from "./textoFlexible.js";

const totalFactura = (f) =>
  f.tipoFactura === "Factura X" || f.tipoFactura === "Factura B" ? f.total : f.total * 1.21;

export const sumaMedios = (doc) =>
  (doc?.mediosPago || []).reduce((s, m) => s + (Number(m.monto) || 0), 0);

// Saldo del proveedor, igual que en la cuenta corriente:
// facturas − notas de crédito − pagos + devoluciones (lo que nos devolvió).
// Negativo = le pagamos de más y nos debe plata.
export const saldoProveedor = async (proveedor, { excluirDevolucionId } = {}) => {
  const filtro = { proveedor: regexTexto(proveedor) };
  const [facturas, pagos, devoluciones] = await Promise.all([
    FacturaProveedor.find(filtro, "tipoFactura total").lean(),
    PagoProveedor.find(filtro, "mediosPago").lean(),
    Cobro.find({ cliente: regexTexto(proveedor), origen: "proveedor" }, "mediosPago").lean(),
  ]);
  const facturado = facturas.reduce((s, f) => {
    const monto = totalFactura(f);
    return f.tipoFactura === "Nota de Crédito" ? s - Math.abs(monto) : s + monto;
  }, 0);
  const pagado = pagos.reduce((s, p) => s + sumaMedios(p), 0);
  const devuelto = devoluciones
    .filter((d) => !excluirDevolucionId || d._id.toString() !== excluirDevolucionId.toString())
    .reduce((s, d) => s + sumaMedios(d), 0);
  return Math.round((facturado - pagado + devuelto) * 100) / 100 || 0;
};
