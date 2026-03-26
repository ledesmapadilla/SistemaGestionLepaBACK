import Cliente from "../models/cliente.js";

// CREATE (ya la tenés)
export const crearCliente = async (req, res) => {
  console.log("BODY QUE LLEGA:", req.body);
  try {
    const nuevoCliente = new Cliente(req.body);
    await nuevoCliente.save();

    res.status(201).json({
      msg: "Cliente creado correctamente",
      cliente: nuevoCliente,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear cliente" });
  }
};

// READ - obtener todos
export const obtenerClientes = async (req, res) => {
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

    const clientes = await Cliente.find(filtros);

    res.status(200).json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener clientes" });
  }
};


// UPDATE
export const editarCliente = async (req, res) => {
  try {
    const clienteActualizado = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      msg: "Cliente actualizado",
      cliente: clienteActualizado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar cliente" });
  }
};

// DELETE
export const eliminarCliente = async (req, res) => {
  try {
    await Cliente.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Cliente eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar cliente" });
  }
};
