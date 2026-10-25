import Proveedor from "../models/proveedor.js";
import { mismoTexto } from "../helpers/textoFlexible.js";

// Razón social repetida aunque esté escrita distinto (mayúsculas, acentos, espacios).
const razonSocialRepetida = async (razonsocial, idExcluir) => {
  if (razonsocial === undefined) return false;
  const todos = await Proveedor.find({}, { razonsocial: 1 }).lean();
  return todos.some((x) => String(x._id) !== String(idExcluir) && mismoTexto(x.razonsocial, razonsocial));
};
const MSG_REPETIDO = "Ya existe un proveedor con esa razón social";

// El teléfono es opcional pero único (índice sparse): un "" contaría como valor
// y chocaría entre proveedores sin teléfono, así que vacío = campo ausente.
const sinTelefonoVacio = (body) => {
  const datos = { ...body };
  if (typeof datos.telefono === "string") datos.telefono = datos.telefono.trim();
  const vacio = datos.telefono === "" || datos.telefono == null;
  if (vacio) delete datos.telefono;
  return { datos, vacio: vacio && "telefono" in body };
};

export const crearProveedor = async (req, res) => {
  try {
    if (await razonSocialRepetida(req.body.razonsocial)) {
      return res.status(400).json({ msg: MSG_REPETIDO, mensaje: MSG_REPETIDO });
    }
    // En el alta manual el teléfono es obligatorio (el personal se da de alta
    // por helpers/proveedorDePersonal.js, que no pasa por acá).
    const { datos } = sinTelefonoVacio(req.body);
    if (!datos.telefono) {
      const msg = "El teléfono es obligatorio";
      return res.status(400).json({ msg, mensaje: msg });
    }
    const nuevoProveedor = new Proveedor(datos);
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
    if (await razonSocialRepetida(req.body.razonsocial, req.params.id)) {
      return res.status(400).json({ msg: MSG_REPETIDO, mensaje: MSG_REPETIDO });
    }
    const { datos, vacio } = sinTelefonoVacio(req.body);
    const proveedorActualizado = await Proveedor.findByIdAndUpdate(
      req.params.id,
      vacio ? { $set: datos, $unset: { telefono: 1 } } : datos,
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
