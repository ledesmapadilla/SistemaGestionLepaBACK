import Maquina from "../models/maquina.js";
import ServiceMaquina from "../models/serviceMaquina.js";
import Asistencia from "../models/asistencia.js";

const EXCLUIDAS = [
  "carreton grande", "carretón grande",
  "carreton chico", "carretón chico",
  "batea 1", "batea 2",
];

// La fecha de los services puede venir como Date o como string "YYYY-MM-DD"
// según cómo se haya cargado. Normalizamos a "YYYY-MM-DD" sin romper.
const aFechaISO = (f) => {
  if (!f) return null;
  if (f instanceof Date) return f.toISOString().slice(0, 10);
  return String(f).slice(0, 10);
};

export const obtenerTablero = async (req, res) => {
  try {
    const [maquinas, services, maxPorMaquina] = await Promise.all([
      Maquina.find().lean(),
      ServiceMaquina.find().lean(),
      Asistencia.aggregate([
        { $match: { "registros.maquina": { $gt: "" } } },
        { $sort: { fecha: 1 } },
        { $unwind: "$registros" },
        { $match: { "registros.maquina": { $exists: true, $ne: null, $ne: "" } } },
        { $addFields: {
          maquinaLow: { $toLower: { $trim: { input: "$registros.maquina" } } },
          horometroNum: { $convert: { input: "$registros.horometro", to: "double", onError: 0, onNull: 0 } },
        }},
        { $match: { horometroNum: { $gt: 0 } } },
        { $group: { _id: "$maquinaLow", horometro: { $last: "$horometroNum" }, fecha: { $last: "$fecha" } } },
      ]),
    ]);

    const asistenciaMap = Object.fromEntries(
      maxPorMaquina.map((item) => [item._id, { horometro: item.horometro, fecha: item.fecha }])
    );

    const maquinasFiltradas = maquinas.filter(
      (m) => !EXCLUIDAS.includes(m.maquina?.toLowerCase().trim())
    );

    const tablero = maquinasFiltradas.map((maquina) => {
      const nombreLow = maquina.maquina?.toLowerCase().trim();

      // Horómetro desde ServiceMaquina tipo="horas"
      const horasServices = services.filter(
        (s) => String(s.maquina) === String(maquina._id) && s.tipo === "horas" && s.horometro != null
      );
      const maxSvc = horasServices.length > 0
        ? horasServices.reduce((max, s) => Number(s.horometro) > Number(max.horometro) ? s : max)
        : null;

      // Horómetro desde Asistencia (pre-calculado con aggregation)
      const astData = asistenciaMap[nombreLow] || null;
      const maxAst = astData ? { horometro: astData.horometro, fecha: astData.fecha } : null;

      // Horómetro actual: el mayor entre ambas fuentes
      let horometroActual = null;
      let fechaUltimoRegistro = null;
      if (maxSvc && maxAst) {
        if (Number(maxSvc.horometro) >= maxAst.horometro) {
          horometroActual = Number(maxSvc.horometro);
          fechaUltimoRegistro = aFechaISO(maxSvc.fecha);
        } else {
          horometroActual = maxAst.horometro;
          fechaUltimoRegistro = maxAst.fecha;
        }
      } else if (maxSvc) {
        horometroActual = Number(maxSvc.horometro);
        fechaUltimoRegistro = aFechaISO(maxSvc.fecha);
      } else if (maxAst) {
        horometroActual = maxAst.horometro;
        fechaUltimoRegistro = maxAst.fecha;
      }

      // Último service (tipo="service", más reciente por fecha)
      const servicesEsta = services
        .filter((s) => String(s.maquina) === String(maquina._id) && s.tipo === "service")
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      const ultimoService = servicesEsta[0] || null;

      const fechaUltimoService = aFechaISO(ultimoService?.fecha);
      const horometroUltimoService = ultimoService?.horometro != null
        ? Number(ultimoService.horometro)
        : null;
      const proximoService = horometroUltimoService != null ? horometroUltimoService + 250 : null;

      let estado = null;
      if (proximoService != null && horometroActual != null) {
        estado = horometroActual >= proximoService ? "ATRASADO" : "OK";
      }

      return {
        _id: maquina._id,
        nombre: maquina.maquina,
        horometroActual,
        fechaUltimoRegistro,
        fechaUltimoService,
        horometroUltimoService,
        proximoService,
        estado,
      };
    });

    res.status(200).json(tablero);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener tablero" });
  }
};
