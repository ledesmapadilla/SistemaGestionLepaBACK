import Factura from "../models/factura.js";
import Remito from "../models/remito.js";

// El `montoFacturado` de un remito NO se lleva sumando y restando a medida que
// se cargan facturas y notas de crédito: se recalcula siempre desde cero a
// partir de las facturas vigentes que lo incluyen. Sumar/restar dependía del
// orden: si un remito se refacturaba (Factura 415/416) antes de cargar la NC
// de la original (414), la NC le restaba lo de la 414 y el remito quedaba en
// $0 "Sin facturar" aunque las facturas nuevas lo cubrían completo.
//
// Reglas:
// - Suma lo que le asigna cada Factura A/X no anulada (`montosPorRemito`).
// - Una factura está anulada si su estadoPago es "Anulada" o si alguna NC del
//   mismo cliente la tiene como `facturaAsociada`.
// - Una NC con factura asociada actúa anulando esa factura (no resta aparte).
//   Una NC sin factura asociada resta lo que tiene asignado al remito.
// - El resultado queda entre 0 y el total del remito.
// - Facturas viejas sin `montosPorRemito`: si tiene un solo remito, cuenta su
//   total; si tiene varios y alcanza a cubrirlos a todos, cuenta el remito
//   completo; si no, no hay forma de saber cuánto le tocó y el remito se deja
//   como está.

const redondear = (n) => Math.round(n * 100) / 100;

export const calcularTotalRemito = (items = []) =>
  items.reduce((s, i) => s + (Number(i.cantidad) || 0) * (Number(i.precioUnitario) || 0), 0);

const esNC = (f) => f.tipoFactura === "Nota de Crédito";

const estadoSegunMonto = (total, monto) =>
  total > 0 && total - monto < 1 ? "Facturado" : "Sin facturar";

// Calcula el montoFacturado correcto de cada remito. Devuelve
// { [remitoId]: { total, monto } }; los remitos ambiguos no aparecen.
// `excluirFacturaId` deja afuera una factura (la que se está borrando).
export const calcularMontosFacturados = async (remitoIds, { excluirFacturaId } = {}) => {
  const ids = [...new Set((remitoIds || []).map(String))];
  if (ids.length === 0) return {};

  const filtroExcluir = excluirFacturaId ? { _id: { $ne: excluirFacturaId } } : {};
  const facturas = await Factura.find({ remitos: { $in: ids }, ...filtroExcluir })
    .select("tipoFactura numeroFactura cliente remitos total montosPorRemito estadoPago facturaAsociada")
    .lean();

  // NC que anulan facturas: se buscan por número de factura asociada, aunque
  // la NC no incluya todos los remitos de la original.
  const numeros = facturas.filter((f) => !esNC(f)).map((f) => f.numeroFactura);
  const ncsAsociadas = numeros.length
    ? await Factura.find({
        tipoFactura: "Nota de Crédito",
        facturaAsociada: { $in: numeros },
        ...filtroExcluir,
      })
        .select("cliente facturaAsociada")
        .lean()
    : [];
  const anuladaPorNC = new Set(ncsAsociadas.map((nc) => `${nc.cliente}|${nc.facturaAsociada}`));
  const estaAnulada = (f) =>
    f.estadoPago === "Anulada" || anuladaPorNC.has(`${f.cliente}|${f.numeroFactura}`);

  // Totales de todos los remitos que aparecen en esas facturas (hacen falta
  // para el caso de facturas viejas de varios remitos).
  const todos = new Set(ids);
  facturas.forEach((f) => (f.remitos || []).forEach((id) => todos.add(String(id))));
  const remitos = await Remito.find({ _id: { $in: [...todos] } }).select("items").lean();
  const totalPorId = Object.fromEntries(
    remitos.map((r) => [String(r._id), redondear(calcularTotalRemito(r.items))])
  );

  const resultado = {};
  for (const id of ids) {
    if (totalPorId[id] === undefined) continue; // remito borrado
    const total = totalPorId[id];
    let monto = 0;
    let ambiguo = false;

    for (const f of facturas) {
      if (!(f.remitos || []).some((x) => String(x) === id)) continue;
      const asignado = (f.montosPorRemito || []).find((m) => String(m.remitoId) === id);

      if (esNC(f)) {
        if (f.facturaAsociada) continue; // actúa anulando la factura asociada
        monto -= asignado ? Math.abs(Number(asignado.monto) || 0) : total;
        continue;
      }
      if (estaAnulada(f)) continue;

      if (asignado) {
        monto += Number(asignado.monto) || 0;
      } else if ((f.remitos || []).length === 1) {
        monto += Number(f.total) || 0;
      } else {
        const sumaHermanos = redondear(
          (f.remitos || []).reduce((s, x) => s + (totalPorId[String(x)] || 0), 0)
        );
        if ((Number(f.total) || 0) >= sumaHermanos - 1) monto += total;
        else ambiguo = true;
      }
    }

    if (ambiguo) continue;
    resultado[id] = { total, monto: Math.min(total, Math.max(0, redondear(monto))) };
  }
  return resultado;
};

// Recalcula y guarda montoFacturado y estado de los remitos indicados. Un
// remito "Obra propia" conserva su estado.
export const sincronizarRemitos = async (remitoIds, opciones) => {
  const montos = await calcularMontosFacturados(remitoIds, opciones);
  const ids = Object.keys(montos);
  if (ids.length === 0) return 0;

  const actuales = await Remito.find({ _id: { $in: ids } }).select("estado montoFacturado").lean();
  const ops = [];
  for (const r of actuales) {
    const { total, monto } = montos[String(r._id)];
    const $set = {};
    if (redondear(r.montoFacturado || 0) !== monto) $set.montoFacturado = monto;
    if (r.estado !== "Obra propia") {
      const estado = estadoSegunMonto(total, monto);
      if (r.estado !== estado) $set.estado = estado;
    }
    if (Object.keys($set).length > 0) {
      ops.push({ updateOne: { filter: { _id: r._id }, update: { $set } } });
    }
  }
  if (ops.length > 0) await Remito.bulkWrite(ops);
  return ops.length;
};
