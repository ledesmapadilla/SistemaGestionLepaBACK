import Maquina from "../models/maquina.js";
import ServiceMaquina from "../models/serviceMaquina.js";
import Asistencia from "../models/asistencia.js";

const EXCLUIDAS = [
  "carreton grande", "carretón grande",
  "carreton chico", "carretón chico",
  "batea 1", "batea 2",
];

export const obtenerTablero = async (req, res) => {
  try {
    const [maquinas, services, asistencias] = await Promise.all([
      Maquina.find(),
      ServiceMaquina.find(),
      Asistencia.find(),
    ]);

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

      // Horómetro desde Asistencia
      let maxAst = null;
      for (const dia of asistencias) {
        for (const reg of (dia.registros || [])) {
          if (reg.maquina?.toLowerCase().trim() === nombreLow && reg.horometro) {
            const val = Number(reg.horometro);
            if (!isNaN(val) && (maxAst === null || val > maxAst.horometro)) {
              maxAst = { horometro: val, fecha: dia.fecha };
            }
          }
        }
      }

      // Horómetro actual: el mayor entre ambas fuentes
      let horometroActual = null;
      let fechaUltimoRegistro = null;
      if (maxSvc && maxAst) {
        if (Number(maxSvc.horometro) >= maxAst.horometro) {
          horometroActual = Number(maxSvc.horometro);
          fechaUltimoRegistro = maxSvc.fecha ? maxSvc.fecha.toISOString().slice(0, 10) : null;
        } else {
          horometroActual = maxAst.horometro;
          fechaUltimoRegistro = maxAst.fecha;
        }
      } else if (maxSvc) {
        horometroActual = Number(maxSvc.horometro);
        fechaUltimoRegistro = maxSvc.fecha ? maxSvc.fecha.toISOString().slice(0, 10) : null;
      } else if (maxAst) {
        horometroActual = maxAst.horometro;
        fechaUltimoRegistro = maxAst.fecha;
      }

      // Último service (tipo="service", más reciente por fecha)
      const servicesEsta = services
        .filter((s) => String(s.maquina) === String(maquina._id) && s.tipo === "service")
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      const ultimoService = servicesEsta[0] || null;

      const fechaUltimoService = ultimoService?.fecha
        ? ultimoService.fecha.toISOString().slice(0, 10)
        : null;
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
