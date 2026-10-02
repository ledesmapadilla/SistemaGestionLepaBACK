import TareaSemana from "../models/tareaSemana.js";

export const obtenerTareasSemana = async (req, res) => {
  try {
    const docs = await TareaSemana.find().lean();
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener tareas de la semana", detalle: error.message });
  }
};

// Reemplaza todas las tareas semanales de un responsable (editar / borrar).
export const guardarTareasSemana = async (req, res) => {
  try {
    const { responsable, tareas } = req.body;
    if (!responsable) {
      return res.status(400).json({ msg: "Falta el responsable" });
    }
    const doc = await TareaSemana.findOneAndUpdate(
      { responsable },
      { $set: { tareas: tareas || [] } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
    res.status(200).json({ msg: "Tareas de la semana guardadas", data: doc });
  } catch (error) {
    res.status(500).json({ msg: "Error al guardar tareas de la semana", detalle: error.message });
  }
};

// Agrega una tarea desde Pendientes (botón "A semanal") sin pisar las demás.
export const agregarTareaSemana = async (req, res) => {
  try {
    const { responsable, tarea } = req.body;
    if (!responsable || !tarea) {
      return res.status(400).json({ msg: "Faltan el responsable o la tarea" });
    }
    const { desde, hasta } = tarea;
    if (!desde || !hasta) {
      return res.status(400).json({ msg: "Las fechas desde y hasta son obligatorias" });
    }
    if (hasta < desde) {
      return res.status(400).json({ msg: "La fecha hasta no puede ser anterior a desde" });
    }

    // La misma tarea no puede estar dos veces en la misma semana.
    if (tarea.origenId) {
      const repetida = await TareaSemana.exists({
        responsable,
        tareas: { $elemMatch: { origenId: tarea.origenId, desde, hasta } },
      });
      if (repetida) {
        return res.status(409).json({ msg: "La tarea ya está cargada en esa semana" });
      }
    }

    const doc = await TareaSemana.findOneAndUpdate(
      { responsable },
      { $push: { tareas: tarea } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
    res.status(201).json({ msg: "Tarea agregada a la semana", data: doc });
  } catch (error) {
    res.status(500).json({ msg: "Error al agregar la tarea a la semana", detalle: error.message });
  }
};
