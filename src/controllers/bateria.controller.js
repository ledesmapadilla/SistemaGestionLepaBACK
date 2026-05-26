import Bateria from "../models/bateria.js";

export const crearBateria = async (req, res) => {
  try {
    const nueva = new Bateria(req.body);
    await nueva.save();
    const populada = await Bateria.findById(nueva._id).populate("maquina", "maquina");
    res.status(201).json({ msg: "Batería creada correctamente", bateria: populada });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear batería" });
  }
};

export const obtenerBaterias = async (req, res) => {
  try {
    const baterias = await Bateria.find()
      .populate("maquina", "maquina")
      .sort({ createdAt: -1 });
    res.status(200).json(baterias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener baterías", error: error.message });
  }
};

export const editarBateria = async (req, res) => {
  try {
    const actualizada = await Bateria.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("maquina", "maquina");
    if (!actualizada) return res.status(404).json({ msg: "Batería no encontrada" });
    res.status(200).json({ msg: "Batería actualizada", bateria: actualizada });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar batería" });
  }
};

export const eliminarBateria = async (req, res) => {
  try {
    const eliminada = await Bateria.findByIdAndDelete(req.params.id);
    if (!eliminada) return res.status(404).json({ msg: "Batería no encontrada" });
    res.status(200).json({ msg: "Batería eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar batería" });
  }
};
