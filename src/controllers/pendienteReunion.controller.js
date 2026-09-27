import PendienteReunion from "../models/pendienteReunion.js";

const hoy = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

// Al pasar a "Terminado" se guarda la fecha; si se reabre, se limpia.
const conFechaTerminado = (datos, anterior = {}) => {
  if (datos.estado === "Terminado") {
    return { ...datos, fechaTerminado: datos.fechaTerminado || anterior.fechaTerminado || hoy() };
  }
  if (datos.estado === "Pendiente") return { ...datos, fechaTerminado: "" };
  return datos;
};

/*
| GET /pendientes-reunion?estado=Pendiente
*/
export const obtenerPendientesReunion = async (req, res) => {
  try {
    const filtros = {};
    if (req.query.estado) filtros.estado = req.query.estado;
    const docs = await PendienteReunion.find(filtros).sort({ fecha: -1, createdAt: -1 }).lean();
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener pendientes de reunión", detalle: error.message });
  }
};

export const crearPendienteReunion = async (req, res) => {
  try {
    const { fecha, tarea, responsable, estado, observaciones } = req.body;
    if (!(tarea || "").trim()) return res.status(400).json({ msg: "La tarea es obligatoria" });
    const doc = await PendienteReunion.create(
      conFechaTerminado({ fecha: fecha || hoy(), tarea, responsable, estado, observaciones })
    );
    res.status(201).json({ msg: "Pendiente creado", data: doc });
  } catch (error) {
    res.status(500).json({ msg: "Error al crear pendiente de reunión", detalle: error.message });
  }
};

export const editarPendienteReunion = async (req, res) => {
  try {
    const anterior = await PendienteReunion.findById(req.params.id).lean();
    if (!anterior) return res.status(404).json({ msg: "Pendiente no encontrado" });

    const { fecha, tarea, responsable, estado, observaciones } = req.body;
    if (tarea !== undefined && !(tarea || "").trim()) {
      return res.status(400).json({ msg: "La tarea es obligatoria" });
    }
    const cambios = Object.fromEntries(
      Object.entries({ fecha, tarea, responsable, estado, observaciones }).filter(([, v]) => v !== undefined)
    );
    const doc = await PendienteReunion.findByIdAndUpdate(
      req.params.id,
      { $set: conFechaTerminado(cambios, anterior) },
      { new: true, runValidators: true }
    ).lean();
    res.status(200).json({ msg: "Pendiente actualizado", data: doc });
  } catch (error) {
    res.status(500).json({ msg: "Error al editar pendiente de reunión", detalle: error.message });
  }
};

export const borrarPendienteReunion = async (req, res) => {
  try {
    const doc = await PendienteReunion.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ msg: "Pendiente no encontrado" });
    res.status(200).json({ msg: "Pendiente eliminado" });
  } catch (error) {
    res.status(500).json({ msg: "Error al borrar pendiente de reunión", detalle: error.message });
  }
};
