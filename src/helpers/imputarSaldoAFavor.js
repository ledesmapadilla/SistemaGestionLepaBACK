import mongoose from "mongoose";
import Cobro, { PROVEEDOR_FUERA } from "../models/cobro.js";
import Factura from "../models/factura.js";
import { recibidoCobro, imputadoCobro, SALDO_A_FAVOR } from "./saldoAFavor.js";
import { regexTexto } from "./textoFlexible.js";

const r2 = (n) => Math.round(n * 100) / 100;
const totalConIva = (f) => (f.tipoFactura === "Factura X" ? f.total : f.total * 1.21);
const numero = (f) => Number(String(f.numeroFactura).replace(/\D/g, "")) || 0;

// Al crear una factura: si el cliente ya tenía saldo a favor (anticipos o
// pagos de más que se cobraron antes de facturar), se imputa solo a sus
// facturas impagas más viejas (por fecha y número).
//
// Los cobros se siguen imputando a mano; esto solo cubre el caso en que la
// plata entró antes que la factura. Se registra como un cobro con forma de
// pago "Saldo a favor" (igual que la aplicación manual), así se ve en Cobros
// y se puede editar o borrar como cualquier otro.
//
// Devuelve { monto, facturas: [numeroFactura] } o null si no imputó nada.
export const imputarSaldoAFavorAlFacturar = async (cliente, fecha) => {
  if (!cliente) return null;
  const filtroCliente = { cliente: regexTexto(cliente) };

  const cobros = await Cobro.find({ ...filtroCliente, ...PROVEEDOR_FUERA }, "mediosPago pagos").lean();
  let saldo = r2(cobros.reduce((s, c) => s + recibidoCobro(c) - imputadoCobro(c), 0));
  if (saldo <= 0.01) return null;

  const facturas = await Factura.find(
    { ...filtroCliente, tipoFactura: { $ne: "Nota de Crédito" }, estadoPago: { $ne: "Anulada" } },
    "fecha tipoFactura numeroFactura total"
  ).lean();
  if (!facturas.length) return null;
  facturas.sort((a, b) => (a.fecha || "").localeCompare(b.fecha || "") || numero(a) - numero(b));

  const cobrados = await Cobro.aggregate([
    { $unwind: "$pagos" },
    { $match: { "pagos.factura": { $in: facturas.map((f) => f._id) } } },
    { $group: { _id: "$pagos.factura", total: { $sum: "$pagos.montoCobrado" } } },
  ]);
  const cobradoMap = Object.fromEntries(cobrados.map((r) => [r._id.toString(), r.total]));

  const pagos = [];
  const numeros = [];
  for (const f of facturas) {
    if (saldo <= 0.01) break;
    const pendiente = r2(totalConIva(f) - (cobradoMap[f._id.toString()] || 0));
    if (pendiente <= 0.01) continue;
    const monto = r2(Math.min(saldo, pendiente));
    pagos.push({ factura: f._id, montoCobrado: monto });
    numeros.push(f.numeroFactura);
    saldo = r2(saldo - monto);
  }
  if (!pagos.length) return null;

  const monto = r2(pagos.reduce((s, p) => s + p.montoCobrado, 0));
  await Cobro.create({
    fecha,
    cliente,
    mediosPago: [{ medioPago: SALDO_A_FAVOR, monto }],
    pagos,
    observaciones: "Saldo a favor imputado automáticamente al cargar la factura (a las impagas más viejas).",
  });

  // Estado Pagada/Pendiente de las facturas tocadas.
  const ids = pagos.map((p) => new mongoose.Types.ObjectId(p.factura.toString()));
  const totales = await Cobro.aggregate([
    { $unwind: "$pagos" },
    { $match: { "pagos.factura": { $in: ids } } },
    { $group: { _id: "$pagos.factura", total: { $sum: "$pagos.montoCobrado" } } },
  ]);
  const totalMap = Object.fromEntries(totales.map((r) => [r._id.toString(), r.total]));
  const ops = facturas
    .filter((f) => ids.some((id) => id.equals(f._id)))
    .map((f) => ({
      updateOne: {
        filter: { _id: f._id },
        update: {
          $set: {
            estadoPago:
              (totalMap[f._id.toString()] || 0) >= totalConIva(f) - 0.01 ? "Pagada" : "Pendiente",
          },
        },
      },
    }));
  if (ops.length) await Factura.bulkWrite(ops);

  return { monto, facturas: numeros };
};
