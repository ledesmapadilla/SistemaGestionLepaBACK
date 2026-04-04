import Precio from "../models/precio.js";

// CREATE
export const crearPrecio = async (req, res) => {
  try {
    const nuevoPrecio = new Precio(req.body);
    await nuevoPrecio.save();

    res.status(201).json({
      msg: "Precio creado correctamente",
      precio: nuevoPrecio,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear precio" });
  }
};

// READ - obtener todos
export const obtenerPrecios = async (req, res) => {
  try {
    const precios = await Precio.find();
    res.status(200).json(precios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener precios" });
  }
};

// UPDATE
export const editarPrecio = async (req, res) => {
  try {
    const precioActualizado = await Precio.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      msg: "Precio actualizado",
      precio: precioActualizado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar precio" });
  }
};

// DELETE
export const eliminarPrecio = async (req, res) => {
  try {
    await Precio.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Precio eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar precio" });
  }
};
