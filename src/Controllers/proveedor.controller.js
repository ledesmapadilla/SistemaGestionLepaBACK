import Proveedor from "../models/proveedor.js";

export const crearProveedor = async (req, res) => {
  console.log("BODY QUE LLEGA:", req.body);
  try {
    const nuevoProveedor = new Proveedor(req.body);
    await nuevoProveedor.save();
    res.status(201).json({
      msg: "Proveedor creado correctamente",
      proveedor: nuevoProveedor,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear proveedor" });
  }
};

// READ - obtener todos
export const obtenerProveedores = async (req, res) => {
  try {
    const { nombre, email, telefono } = req.query;

    let filtros = {};

    if (nombre) {
      filtros.nombre = { $regex: nombre, $options: "i" };
    }

    if (email) {
      filtros.email = { $regex: email, $options: "i" };
    }

    if (telefono) {
      filtros.telefono = { $regex: telefono, $options: "i" };
    }

    const proveedores = await Proveedor.find(filtros);

    res.status(200).json(proveedores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener proveedores" });
  }
};


// UPDATE
export const editarProveedor = async (req, res) => {
  try {
    const proveedorActualizado = await Proveedor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      msg: "Proveedor actualizado",
      proveedor: proveedorActualizado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar proveedor" });
  }
};

// DELETE
export const eliminarProveedor = async (req, res) => {
  try {
    await Proveedor.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Proveedor eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar proveedor" });
  }
};
