import mongoose from "mongoose";
import ServiceMaquina from "../models/serviceMaquina.js";
import Asistencia from "../models/asistencia.js";
import Maquina from "../models/maquina.js";

// El horómetro de una máquina solo puede subir. El valor de referencia se busca
// en las dos fuentes donde se carga: los registros de ServiceMaquina (horas y
// service) y los horómetros de la planilla de Asistencia.
//
// La comparación es cronológica: se toma el mayor valor registrado en una fecha
// anterior o igual a la que se está cargando. Así se sigue pudiendo completar un
// día viejo sin que lo bloquee un valor posterior más alto.

const escapeRegex = (s) => (s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Fecha "YYYY-MM-DD" a partir de un Date o un string.
const aFechaStr = (f) => {
  if (!f) return null;
  if (typeof f === "string") return f.slice(0, 10);
  return new Date(f).toISOString().slice(0, 10);
};

// Mayor horómetro cargado en ServiceMaquina para la máquina.
const maxDeServices = async (maquinaId, { hasta, excluirServiceId } = {}) => {
  if (!maquinaId || !mongoose.isValidObjectId(maquinaId)) return null;
  const match = {
    maquina: new mongoose.Types.ObjectId(String(maquinaId)),
    horometro: { $ne: null },
  };
  if (excluirServiceId && mongoose.isValidObjectId(excluirServiceId)) {
    match._id = { $ne: new mongoose.Types.ObjectId(String(excluirServiceId)) };
  }
  // En la base conviven registros con `fecha` como Date y como string, así que
  // se normaliza a "YYYY-MM-DD" contemplando los dos casos.
  const pipeline = [
    { $match: match },
    {
      $addFields: {
        fechaStr: {
          $cond: [
            { $eq: [{ $type: "$fecha" }, "date"] },
            { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
            { $substrBytes: [{ $ifNull: [{ $toString: "$fecha" }, ""] }, 0, 10] },
          ],
        },
      },
    },
  ];
  if (hasta) pipeline.push({ $match: { fechaStr: { $lte: hasta } } });
  pipeline.push({ $sort: { horometro: -1 } }, { $limit: 1 });

  const [top] = await ServiceMaquina.aggregate(pipeline);
  if (!top || top.horometro == null) return null;
  return { valor: Number(top.horometro), fecha: top.fechaStr, origen: "service" };
};

// Mayor horómetro cargado en Asistencia para esa máquina (guardada por nombre).
const maxDeAsistencia = async (maquinaNombre, { hasta, excluirFecha } = {}) => {
  const nombre = (maquinaNombre || "").trim();
  if (!nombre) return null;

  const matchFecha = {};
  if (hasta) matchFecha.$lte = hasta;
  if (excluirFecha) matchFecha.$ne = excluirFecha;

  const pipeline = [];
  if (Object.keys(matchFecha).length) pipeline.push({ $match: { fecha: matchFecha } });
  pipeline.push(
    { $unwind: "$registros" },
    { $match: { "registros.maquina": { $regex: `^${escapeRegex(nombre)}$`, $options: "i" } } },
    // El horómetro se guarda como string en Asistencia; los vacíos o no
    // numéricos quedan en null y se descartan.
    { $addFields: { valor: { $convert: { input: "$registros.horometro", to: "double", onError: null, onNull: null } } } },
    { $match: { valor: { $gt: 0 } } },
    { $sort: { valor: -1 } },
    { $limit: 1 }
  );

  const [top] = await Asistencia.aggregate(pipeline);
  if (!top) return null;
  return { valor: Number(top.valor), fecha: top.fecha, origen: "asistencia" };
};

// Mayor horómetro registrado para una máquina, mirando ambas fuentes.
// Devuelve { valor, fecha, origen } o null si no hay ninguno.
export const maxHorometro = async (
  { maquinaId, maquinaNombre, hasta, excluirServiceId, excluirFechaAsistencia } = {}
) => {
  const [svc, ast] = await Promise.all([
    maxDeServices(maquinaId, { hasta, excluirServiceId }),
    maxDeAsistencia(maquinaNombre, { hasta, excluirFecha: excluirFechaAsistencia }),
  ]);
  if (svc && ast) return svc.valor >= ast.valor ? svc : ast;
  return svc || ast || null;
};

// Nombre e id de una máquina a partir de cualquiera de los dos.
export const resolverMaquina = async ({ maquinaId, maquinaNombre }) => {
  if (maquinaId && mongoose.isValidObjectId(maquinaId)) {
    const doc = await Maquina.findById(maquinaId).select("maquina").lean();
    if (doc) return { id: doc._id, nombre: doc.maquina };
  }
  const nombre = (maquinaNombre || "").trim();
  if (!nombre) return null;
  const doc = await Maquina.findOne({
    maquina: { $regex: `^${escapeRegex(nombre)}$`, $options: "i" },
  })
    .select("maquina")
    .lean();
  return doc ? { id: doc._id, nombre: doc.maquina } : { id: null, nombre };
};

// Valida un valor contra el máximo registrado. Devuelve null si está OK, o el
// texto del error si es menor.
export const validarHorometro = async ({ maquinaId, maquinaNombre, valor, fecha, excluirServiceId, excluirFechaAsistencia }) => {
  const num = Number(valor);
  if (valor == null || valor === "" || Number.isNaN(num)) return null;

  const maq = await resolverMaquina({ maquinaId, maquinaNombre });
  if (!maq) return null;

  const tope = await maxHorometro({
    maquinaId: maq.id,
    maquinaNombre: maq.nombre,
    hasta: aFechaStr(fecha),
    excluirServiceId,
    excluirFechaAsistencia,
  });
  if (!tope || num >= tope.valor) return null;

  return `${maq.nombre}: el horómetro no puede ser menor a ${tope.valor.toLocaleString("es-AR")} hs (cargado el ${tope.fecha} en ${tope.origen === "service" ? "Service" : "Asistencia"}).`;
};

export { aFechaStr };
