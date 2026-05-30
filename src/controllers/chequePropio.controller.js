import ChequePropio from "../models/chequePropio.js";

export const crearChequePropio = async (req, res) => {
  try {
    const nuevo = new ChequePropio(req.body);
    await nuevo.save();
    res.status(201).json({ msg: "Cheque propio creado", cheque: nuevo });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ msg: "Ya existe un cheque con ese número." });
    }
    console.error(error);
    res.status(500).json({ msg: "Error al crear cheque propio" });
  }
};

export const obtenerChequesPropios = async (req, res) => {
  try {
    const cheques = await ChequePropio.find().sort({ createdAt: -1 });
    res.status(200).json(cheques);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener cheques propios" });
  }
};

export const editarChequePropio = async (req, res) => {
  try {
    const actualizado = await ChequePropio.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actualizado) return res.status(404).json({ msg: "Cheque no encontrado" });
    res.status(200).json({ msg: "Cheque actualizado", cheque: actualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar cheque propio" });
  }
};

export const eliminarChequePropio = async (req, res) => {
  try {
    const eliminado = await ChequePropio.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ msg: "Cheque no encontrado" });
    res.status(200).json({ msg: "Cheque eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar cheque propio" });
  }
};
