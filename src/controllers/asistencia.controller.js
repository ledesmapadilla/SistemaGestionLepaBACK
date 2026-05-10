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
    console.log("RECIBIDO:", fecha, registros?.map(r => `${r.personal}=remito:${r.remito}`).join(", "));

    let doc = await Asistencia.findOne({ fecha });
    if (doc) {
      doc.registros = registros;
      doc.markModified("registros");
      await doc.save();
    } else {
      doc = new Asistencia({ fecha, registros });
      await doc.save();
    }

    console.log("GUARDADO:", doc.registros?.map(r => `${r.personal}=remito:${r.remito}`).join(", "));
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

export const eliminarPersonalDeAsistencias = async (req, res) => {
  try {
    const { nombre, desde } = req.query;
    if (!nombre) return res.status(400).json({ msg: "Falta el nombre" });

    const filtroDoc = desde ? { fecha: { $gte: desde } } : {};
    const result = await Asistencia.updateMany(
      filtroDoc,
      { $pull: { registros: { personal: { $regex: new RegExp(`^${nombre.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } } } }
    );

    console.log(`Eliminado "${nombre}" desde ${desde}: ${result.modifiedCount} planillas modificadas`);
    res.status(200).json({ msg: `Personal eliminado de ${result.modifiedCount} planillas`, modificados: result.modifiedCount });
  } catch (error) {
    console.error("Error en eliminarPersonalDeAsistencias:", error);
    res.status(500).json({ msg: "Error al eliminar personal de asistencias", detalle: error.message });
  }
};
