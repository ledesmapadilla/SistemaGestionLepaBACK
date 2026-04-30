import Asistencia from "../models/asistencia.js";

export const obtenerAsistencia = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (fecha) {
      const doc = await Asistencia.findOne({ fecha });
      return res.status(200).json(doc || null);
    }
    const docs = await Asistencia.find().sort({ fecha: -1 });
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener asistencia", detalle: error.message });
  }
};

export const guardarAsistencia = async (req, res) => {
  try {
    const { fecha, registros } = req.body;
    const doc = await Asistencia.findOneAndUpdate(
      { fecha },
      { fecha, registros },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json({ msg: "Asistencia guardada", data: doc });
  } catch (error) {
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
