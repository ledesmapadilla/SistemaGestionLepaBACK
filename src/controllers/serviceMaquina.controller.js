import ServiceMaquina from "../models/serviceMaquina.js";
import { validarHorometro } from "../helpers/horometro.js";

export const crearService = async (req, res) => {
  try {
    // El horómetro nunca puede retroceder.
    const error = await validarHorometro({
      maquinaId: req.body.maquina,
      valor: req.body.horometro,
      fecha: req.body.fecha,
    });
    if (error) return res.status(400).json({ msg: error });

    const nuevo = new ServiceMaquina(req.body);
    await nuevo.save();
    const populado = await ServiceMaquina.findById(nuevo._id).populate("maquina", "maquina");
    res.status(201).json({ msg: "Service creado correctamente", service: populado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear service" });
  }
};

export const obtenerServices = async (req, res) => {
  try {
    const services = await ServiceMaquina.find()
      .populate("maquina", "maquina")
      .sort({ fecha: -1 });
    res.status(200).json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener services", error: error.message });
  }
};

export const editarService = async (req, res) => {
  try {
    // Se compara contra el resto de los registros: el propio no cuenta como tope.
    const actual = await ServiceMaquina.findById(req.params.id).select("maquina fecha").lean();
    const error = await validarHorometro({
      maquinaId: req.body.maquina || actual?.maquina,
      valor: req.body.horometro,
      fecha: req.body.fecha || actual?.fecha,
      excluirServiceId: req.params.id,
    });
    if (error) return res.status(400).json({ msg: error });

    const actualizado = await ServiceMaquina.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("maquina", "maquina");

    if (!actualizado) {
      return res.status(404).json({ msg: "Service no encontrado" });
    }

    res.status(200).json({ msg: "Service actualizado", service: actualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar service" });
  }
};

export const eliminarService = async (req, res) => {
  try {
    const eliminado = await ServiceMaquina.findByIdAndDelete(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ msg: "Service no encontrado" });
    }
    res.status(200).json({ msg: "Service eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar service" });
  }
};
