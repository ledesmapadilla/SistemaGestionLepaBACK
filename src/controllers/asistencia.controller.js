import Asistencia from "../models/asistencia.js";
import { validarHorometro } from "../helpers/horometro.js";

export const obtenerAsistencia = async (req, res) => {
  try {
    const { fecha, anio, mes, desde, hasta } = req.query;
    if (fecha) {
      const doc = await Asistencia.findOne({ fecha }).lean();
      return res.status(200).json(doc || null);
    }
    // Rango de fechas (ej. una semana) en una sola consulta. Las fechas son
    // strings ISO "YYYY-MM-DD", así que la comparación lexicográfica es correcta.
    if (desde && hasta) {
      const docs = await Asistencia.find({ fecha: { $gte: desde, $lte: hasta } })
        .sort({ fecha: 1 })
        .lean();
      return res.status(200).json(docs);
    }
    let filtro = {};
    if (anio) {
      // Rango por prefijo de fecha (usa el índice de `fecha`, a diferencia del
      // $regex que forzaba scan). Las fechas son "YYYY-MM-DD", comparación léxica.
      if (mes !== undefined) {
        const mesNum = Number(mes) + 1;
        const desde = `${anio}-${String(mesNum).padStart(2, "0")}`;
        const hasta = mesNum === 12
          ? `${Number(anio) + 1}-01`
          : `${anio}-${String(mesNum + 1).padStart(2, "0")}`;
        filtro = { fecha: { $gte: desde, $lt: hasta } };
      } else {
        filtro = { fecha: { $gte: `${anio}`, $lt: `${Number(anio) + 1}` } };
      }
    }
    const docs = await Asistencia.find(filtro).sort({ fecha: -1 }).lean();
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener asistencia", detalle: error.message });
  }
};

export const guardarAsistencia = async (req, res) => {
  try {
    const { fecha, registros } = req.body;

    // El horómetro nunca puede retroceder. Se valida cada máquina cargada en la
    // planilla contra lo que ya hay registrado hasta esa fecha (sin contar el
    // día que se está guardando, que es el que se reemplaza).
    const porMaquina = new Map();
    (registros || []).forEach((r) => {
      const nombre = (r?.maquina || "").trim();
      const valor = Number(r?.horometro);
      if (!nombre || !r?.horometro || Number.isNaN(valor) || valor <= 0) return;
      const previo = porMaquina.get(nombre.toLowerCase());
      // Si el mismo día tiene varias filas de la misma máquina, alcanza con
      // validar la menor: si esa pasa, las demás también.
      if (previo == null || valor < previo.valor) porMaquina.set(nombre.toLowerCase(), { nombre, valor });
    });

    if (porMaquina.size > 0) {
      const errores = (
        await Promise.all(
          [...porMaquina.values()].map((m) =>
            validarHorometro({
              maquinaNombre: m.nombre,
              valor: m.valor,
              fecha,
              excluirFechaAsistencia: fecha,
            })
          )
        )
      ).filter(Boolean);

      if (errores.length > 0) {
        return res.status(400).json({ msg: errores.join("\n") });
      }
    }

    let doc = await Asistencia.findOne({ fecha });
    if (doc) {
      doc.registros = registros;
      doc.markModified("registros");
      await doc.save();
    } else {
      doc = new Asistencia({ fecha, registros });
      await doc.save();
    }

    res.status(200).json({ msg: "Asistencia guardada", data: doc });
  } catch (error) {
    console.error("Error en guardarAsistencia:", error);
    res.status(500).json({ msg: "Error al guardar asistencia", detalle: error.message });
  }
};

export const eliminarAsistencia = async (req, res) => {
  try {
    await Asistencia.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Asistencia eliminada" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar asistencia", detalle: error.message });
  }
};

export const eliminarAsistenciaPorFecha = async (req, res) => {
  try {
    const { fecha } = req.params;
    const [anio, mes, dia] = fecha.split("-");
    const diaNum = parseInt(dia, 10);
    // Acepta "2026-05-03" y "2026-05-3" (con o sin zero-padding)
    const regex = new RegExp(`^${anio}-${mes}-0?${diaNum}$`);
    const doc = await Asistencia.findOne({ fecha: regex });
    if (!doc) {
      return res.status(404).json({ msg: "No se encontró asistencia para esa fecha", fecha });
    }
    await Asistencia.findByIdAndDelete(doc._id);
    res.status(200).json({ msg: "Asistencia eliminada", fecha: doc.fecha });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar asistencia", detalle: error.message });
  }
};

export const eliminarPersonalDeAsistencias = async (req, res) => {
  try {
    const { nombre, desde } = req.query;
    if (!nombre) return res.status(400).json({ msg: "Falta el nombre" });

    const filtroDoc = desde ? { fecha: { $gte: desde } } : {};
    const result = await Asistencia.updateMany(
      filtroDoc,
      { $pull: { registros: { personal: { $regex: new RegExp(`^${nombre.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } } } }
    );

    res.status(200).json({ msg: `Personal eliminado de ${result.modifiedCount} planillas`, modificados: result.modifiedCount });
  } catch (error) {
    console.error("Error en eliminarPersonalDeAsistencias:", error);
    res.status(500).json({ msg: "Error al eliminar personal de asistencias", detalle: error.message });
  }
};
