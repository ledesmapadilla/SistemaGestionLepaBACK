import PendienteResponsable from "../models/pendienteResponsable.js";

export const obtenerTodosPendientes = async (req, res) => {
  try {
    const docs = await PendienteResponsable.find().lean();
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener pendientes", detalle: error.message });
  }
};

export const guardarPendientes = async (req, res) => {
  try {
    const { responsable, tareas } = req.body;
    if (!responsable) {
      return res.status(400).json({ msg: "Falta el responsable" });
    }
    let doc = await PendienteResponsable.findOne({ responsable });
    if (doc) {
      doc.tareas = tareas || [];
      doc.markModified("tareas");
      await doc.save();
    } else {
      doc = new PendienteResponsable({ responsable, tareas: tareas || [] });
      await doc.save();
    }
    res.status(200).json({ msg: "Pendientes guardados", data: doc });
  } catch (error) {
    res.status(500).json({ msg: "Error al guardar pendientes", detalle: error.message });
  }
};
