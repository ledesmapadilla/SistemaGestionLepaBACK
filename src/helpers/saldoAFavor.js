import Cobro from "../models/cobro.js";

// Forma de pago que no es plata nueva: consume el saldo a favor que el
// cliente dejó en cobros anteriores (pagó de más o dejó un anticipo).
export const SALDO_A_FAVOR = "Saldo a favor";

// Plata que realmente entró en el cobro (sin la aplicación de saldo a favor).
// Los cobros viejos sin mediosPago entraron exactamente lo imputado.
export const recibidoCobro = (c) =>
  c?.mediosPago?.length
    ? c.mediosPago
        .filter((m) => m.medioPago !== SALDO_A_FAVOR)
        .reduce((s, m) => s + (Number(m.monto) || 0), 0)
    : imputadoCobro(c);

// Lo que el cobro cancela de facturas.
export const imputadoCobro = (c) =>
  (c?.pagos || []).reduce((s, p) => s + (Number(p.montoCobrado) || 0), 0);

export const usadoSaldoAFavor = (c) =>
  (c?.mediosPago || [])
    .filter((m) => m.medioPago === SALDO_A_FAVOR)
    .reduce((s, m) => s + (Number(m.monto) || 0), 0);

// Saldo a favor del cliente = todo lo recibido − todo lo imputado a facturas.
// `excluirId` saca un cobro (el que se edita/borra) y `incluir` suma el cobro
// propuesto, para validar el resultado antes de guardarlo.
export const saldoAFavorCliente = async (cliente, { excluirId, incluir } = {}) => {
  const cobros = await Cobro.find({ cliente }, "mediosPago pagos").lean();
  const lista = cobros.filter((c) => !excluirId || c._id.toString() !== excluirId.toString());
  if (incluir) lista.push(incluir);
  const saldo = lista.reduce((s, c) => s + recibidoCobro(c) - imputadoCobro(c), 0);
  return Math.round(saldo * 100) / 100 || 0;
};
