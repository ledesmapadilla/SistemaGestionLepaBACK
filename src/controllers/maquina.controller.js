import Maquina from "../models/maquina.js";

// CREATE
export const crearMaquina = async (req, res) => {
  try {
    const nuevaMaquina = new Maquina(req.body);
    await nuevaMaquina.save();
    res.status(201).json({
      msg: "Máquina creada correctamente",
      maquina: nuevaMaquina,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear máquina" });
  }
};


export const obtenerMaquinas = async (req, res) => {
  try {
    const { maquina, patente, modelo, marca } = req.query; // <-- Agregamos marca aquí

    let filtros = {};

    if (maquina) {
      filtros.maquina = { $regex: maquina, $options: "i" };
    }
    if (marca) { // <-- Filtro por marca
      filtros.marca = { $regex: marca, $options: "i" };
    }
    if (patente) {
      filtros.patente = { $regex: patente, $options: "i" };
    }
    if (modelo) {
      filtros.modelo = { $regex: modelo, $options: "i" };
    }

    const maquinas = await Maquina.find(filtros).sort({ createdAt: -1 });
    res.status(200).json(maquinas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener máquinas" });
  }
};

// UPDATE
export const editarMaquina = async (req, res) => {
  try {
    // { new: true } es clave para que devuelva el objeto ya modificado al front
    const maquinaActualizada = await Maquina.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!maquinaActualizada) {
      return res.status(404).json({ msg: "Máquina no encontrada" });
    }

    res.status(200).json({
      msg: "Máquina actualizada",
      maquina: maquinaActualizada,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar máquina" });
  }
};

// DELETE
export const eliminarMaquina = async (req, res) => {
  try {
    const maquinaEliminada = await Maquina.findByIdAndDelete(req.params.id);
    
    if (!maquinaEliminada) {
      return res.status(404).json({ msg: "Máquina no encontrada" });
    }

    res.status(200).json({ msg: "Máquina eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar máquina" });
  }
};