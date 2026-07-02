import ReparacionMaquina from "../models/reparacionMaquina.js";

export const obtenerTodasReparaciones = async (req, res) => {
  try {
    const docs = await ReparacionMaquina.find()
      .populate("maquina", "maquina")
      .lean();
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener reparaciones", detalle: error.message });
  }
};

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
    // Upsert en un solo viaje a la base (antes eran findOne + save).
    const doc = await ReparacionMaquina.findOneAndUpdate(
      { maquina },
      { $set: { reparaciones: reparaciones || [] } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ msg: "Reparaciones guardadas", data: doc });
  } catch (error) {
    res.status(500).json({ msg: "Error al guardar reparaciones", detalle: error.message });
  }
};
