import Obra from "../models/obra.js";
import Cliente from "../models/cliente.js";

// CREATE (ya la tenés)
export const crearObra = async (req, res) => {
  try {
    const clienteExiste = await Cliente.findOne({
      razonsocial: req.body.razonsocial,
    });

    if (!clienteExiste) {
      return res.status(400).json({
        mensaje: "La razón social no existe",
      });
    }

    const obraNueva = new Obra(req.body);
    await obraNueva.save();

    res.status(201).json(obraNueva);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear obra" });
  }
};

// READ - obtener una por ID
export const obtenerObraPorId = async (req, res) => {
  try {
    const obra = await Obra.findById(req.params.id);
    if (!obra) return res.status(404).json({ msg: "Obra no encontrada" });
    res.status(200).json(obra);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener obra" });
  }
};

// READ - obtener todos
export const obtenerObras = async (req, res) => {
  try {
    const { razonsocial, nombreobra, contacto, estado } = req.query;

    let filtros = {};

    if (razonsocial) {
      filtros.razonsocial = { $regex: razonsocial, $options: "i" };
    }

    if (nombreobra) {
      filtros.nombreobra = { $regex: nombreobra, $options: "i" };
    }

    if (contacto) {
      filtros.contacto = { $regex: contacto, $options: "i" };
    }
    if (estado) {
      filtros.estado = { $regex: estado, $options: "i" };
    }

    const obras = await Obra.find(filtros);
    res.status(200).json(obras);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener obras" });
  }
};

// UPDATE
export const editarObra = async (req, res) => {
  try {
    const { id } = req.params;

    const obraActualizada = await Obra.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!obraActualizada) {
      return res.status(404).json({ message: "Obra no encontrada" });
    }

    res.json(obraActualizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE
export const eliminarObra = async (req, res) => {
  try {
    await Obra.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Obra eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar obra" });
  }
};
