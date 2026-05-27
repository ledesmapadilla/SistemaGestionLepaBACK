import RegistroBateria from "../models/registroBateria.js";
import "../models/bateria.js";   // registrar modelo para populate
import "../models/maquina.js";   // registrar modelo para populate

export const crearRegistro = async (req, res) => {
  try {
    const nuevo = new RegistroBateria(req.body);
    await nuevo.save();
    const populado = await RegistroBateria.findById(nuevo._id)
      .populate("bateria", "nombreBateria marca")
      .populate("maquina", "maquina");
    res.status(201).json({ msg: "Registro creado correctamente", registro: populado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear registro de batería", error: error.message });
  }
};

export const obtenerRegistros = async (req, res) => {
  try {
    const registros = await RegistroBateria.find()
      .populate("bateria", "nombreBateria marca")
      .populate("maquina", "maquina")
      .sort({ createdAt: -1 });
    res.status(200).json(registros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener registros de baterías", error: error.message });
  }
};

export const editarRegistro = async (req, res) => {
  try {
    const actualizado = await RegistroBateria.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("bateria", "nombreBateria marca")
      .populate("maquina", "maquina");
    if (!actualizado) return res.status(404).json({ msg: "Registro no encontrado" });
    res.status(200).json({ msg: "Registro actualizado", registro: actualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar registro de batería" });
  }
};

export const eliminarRegistro = async (req, res) => {
  try {
    const eliminado = await RegistroBateria.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ msg: "Registro no encontrado" });
    res.status(200).json({ msg: "Registro eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar registro de batería" });
  }
};
