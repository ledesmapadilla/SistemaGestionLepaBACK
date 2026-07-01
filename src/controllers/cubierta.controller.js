import Cubierta from "../models/cubierta.js";

// Registros previos a la separación por categoría no tienen el campo:
// se consideran "camiones".
const filtroCategoria = (categoria) =>
  (!categoria || categoria === "camiones")
    ? { $or: [{ categoria: "camiones" }, { categoria: { $exists: false } }] }
    : { categoria };

export const crearCubierta = async (req, res) => {
  try {
    const nueva = new Cubierta(req.body);
    await nueva.save();
    res.status(201).json({ msg: "Cubierta creada correctamente", cubierta: nueva });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ msg: "Ya existe una cubierta con ese nombre." });
    }
    console.error(error);
    res.status(500).json({ msg: "Error al crear cubierta" });
  }
};

export const obtenerCubiertas = async (req, res) => {
  try {
    const cubiertas = await Cubierta.find(filtroCategoria(req.query.categoria)).sort({ createdAt: -1 });
    res.status(200).json(cubiertas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener cubiertas", error: error.message });
  }
};

export const editarCubierta = async (req, res) => {
  try {
    const actualizada = await Cubierta.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actualizada) return res.status(404).json({ msg: "Cubierta no encontrada" });
    res.status(200).json({ msg: "Cubierta actualizada", cubierta: actualizada });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ msg: "Ya existe una cubierta con ese nombre." });
    }
    console.error(error);
    res.status(500).json({ msg: "Error al editar cubierta" });
  }
};

export const eliminarCubierta = async (req, res) => {
  try {
    const eliminada = await Cubierta.findByIdAndDelete(req.params.id);
    if (!eliminada) return res.status(404).json({ msg: "Cubierta no encontrada" });
    res.status(200).json({ msg: "Cubierta eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar cubierta" });
  }
};
