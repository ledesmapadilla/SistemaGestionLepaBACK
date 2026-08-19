import Obra from "../models/obra.js";
import Maquina from "../models/maquina.js";
import Personal from "../models/personal.js";
import CargaGasoil from "../models/cargaGasoil.js";

// Los únicos que cargan gasoil, igual que en el modal del front.
const QUIENES_CARGAN = ["Nacho", "Agustín", "Castillo, Nelson", "Ruiz, Mauricio"];

// No hay cargas anteriores a 2026: el selector de la página arranca ahí y el
// backend rechaza cualquier año previo.
const ANIO_MINIMO = 2026;

// Endpoint sin token: lo consume la página /gasoil/carga desde el celular, que
// no loguea. Por eso devuelve SOLO los nombres que necesitan los selects, con
// proyección explícita: nada de precios de obra, sueldos, CUIT ni contactos.
export const obtenerOpcionesGasoil = async (req, res) => {
  try {
    const [obras, maquinas, personal] = await Promise.all([
      Obra.find({ estado: "En curso" }, "razonsocial nombreobra estado").lean(),
      Maquina.find({ usaGasoil: { $ne: false } }, "maquina").lean(),
      Personal.find({ nombre: { $in: QUIENES_CARGAN } }, "nombre").lean(),
    ]);

    // Sin _id: al front le alcanza con el texto y así no se filtran ids de la base.
    res.status(200).json({
      obras: obras.map((o) => ({
        razonsocial: o.razonsocial,
        nombreobra: o.nombreobra,
        estado: o.estado,
      })),
      maquinas: maquinas.map((m) => ({ maquina: m.maquina })),
      personal: personal.map((p) => ({ nombre: p.nombre })),
    });
  } catch (error) {
    console.error("Error al obtener opciones públicas de gasoil:", error);
    res
      .status(500)
      .json({ msg: "Error al obtener las opciones de gasoil", detalle: error.message });
  }
};

// Endpoint sin token para la vista mensual de /gasoil/carga/mes: devuelve
// { fecha, maquina, litros } de las cargas del mes pedido. A propósito no salen
// obra, cliente ni quién cargó: la página del celular muestra qué máquina se
// cargó cada día y, al tocar el día, cuántos litros llevó cada una. El resto
// sigue detrás del login en /api/cargas-gasoil.
export const obtenerCargasGasoilDelMes = async (req, res) => {
  try {
    const anio = Number(req.query.anio);
    const mes = Number(req.query.mes);

    if (!Number.isInteger(anio) || anio < ANIO_MINIMO) {
      return res.status(400).json({ msg: `El año debe ser ${ANIO_MINIMO} o posterior` });
    }
    if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
      return res.status(400).json({ msg: "El mes debe estar entre 1 y 12" });
    }

    const mm = String(mes).padStart(2, "0");
    // Las fechas se guardan como "YYYY-MM-DD", así que el mes entero es todo lo
    // que empieza con "YYYY-MM": un rango de strings alcanza y usa el índice.
    const desde = `${anio}-${mm}-01`;
    const hasta = `${anio}-${mm}-31`;

    const cargas = await CargaGasoil.find(
      { fecha: { $gte: desde, $lte: hasta } },
      "fecha maquina litros -_id"
    )
      .sort({ fecha: 1 })
      .lean();

    res
      .status(200)
      .json(cargas.map((c) => ({ fecha: c.fecha, maquina: c.maquina, litros: c.litros })));
  } catch (error) {
    console.error("Error al obtener las cargas de gasoil del mes:", error);
    res
      .status(500)
      .json({ msg: "Error al obtener las cargas de gasoil del mes", detalle: error.message });
  }
};
