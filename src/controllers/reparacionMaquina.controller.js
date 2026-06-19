import ReparacionMaquina from "../models/reparacionMaquina.js";

export const obtenerReparacionesPorMaquina = async (req, res) => {
  try {
    const doc = await ReparacionMaquina.findOne({ maquina: req.params.maquinaId }).lean();
    res.status(200).json(doc || { maquina: req.params.maquinaId, reparaciones: [] });
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener reparaciones", detalle: error.message });
  }
};

export const guardarReparaciones = async (req, res) => {
  try {
    const { maquina, reparaciones } = req.body;
    if (!maquina) {
      return res.status(400).json({ msg: "Falta la máquina" });
    }
    let doc = await ReparacionMaquina.findOne({ maquina });
    if (doc) {
      doc.reparaciones = reparaciones || [];
      doc.markModified("reparaciones");
      await doc.save();
    } else {
      doc = new ReparacionMaquina({ maquina, reparaciones: reparaciones || [] });
      await doc.save();
    }
    res.status(200).json({ msg: "Reparaciones guardadas", data: doc });
  } catch (error) {
    res.status(500).json({ msg: "Error al guardar reparaciones", detalle: error.message });
  }
};
