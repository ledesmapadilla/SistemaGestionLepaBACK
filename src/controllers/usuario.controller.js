import Usuario from "../models/usuario.js";
import bcrypt from "bcryptjs";

export const crearUsuario = async (req, res) => {
  try {
    const nuevoUsuario = new Usuario(req.body);
    await nuevoUsuario.save();
    const { contrasena, ...usuarioSinPass } = nuevoUsuario.toObject();
    res.status(201).json({
      msg: "Usuario creado correctamente",
      usuario: usuarioSinPass,
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000 || error.message === "El nombre de usuario ya existe") {
      return res.status(400).json({ msg: "El nombre de usuario ya existe" });
    }
    res.status(500).json({ msg: "Error al crear usuario" });
  }
};

export const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().select("-contrasena");
    res.status(200).json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener usuarios" });
  }
};

export const editarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    usuario.nombre = req.body.nombre;
    usuario.usuario = req.body.usuario;
    usuario.rol = req.body.rol;

    // Solo actualizar contraseña si viene con valor
    if (req.body.contrasena && req.body.contrasena.trim() !== "") {
      usuario.contrasena = req.body.contrasena;
    }

    await usuario.save();

    const { contrasena, ...usuarioSinPass } = usuario.toObject();
    res.status(200).json({
      msg: "Usuario actualizado",
      usuario: usuarioSinPass,
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000 || error.message === "El nombre de usuario ya existe") {
      return res.status(400).json({ msg: "El nombre de usuario ya existe" });
    }
    res.status(500).json({ msg: "Error al editar usuario" });
  }
};

export const verificarAcceso = async (req, res) => {
  try {
    const { contrasena } = req.body;
    const superadmin = await Usuario.findOne({ rol: "superadministrador" });
    if (!superadmin) {
      return res.status(404).json({ msg: "No existe un superadministrador" });
    }
    const coincide = await bcrypt.compare(contrasena, superadmin.contrasena);
    if (!coincide) {
      return res.status(401).json({ msg: "Contraseña incorrecta" });
    }
    res.status(200).json({ msg: "Acceso autorizado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al verificar acceso" });
  }
};

export const loginUsuario = async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;
    const usuarioDB = await Usuario.findOne({ usuario });
    if (!usuarioDB) {
      return res.status(401).json({ msg: "Usuario o contraseña incorrectos" });
    }
    const coincide = await bcrypt.compare(contrasena, usuarioDB.contrasena);
    if (!coincide) {
      return res.status(401).json({ msg: "Usuario o contraseña incorrectos" });
    }
    const { contrasena: _, contrasenaVisible: __, ...usuarioSinPass } = usuarioDB.toObject();
    res.status(200).json(usuarioSinPass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al iniciar sesión" });
  }
};

export const eliminarUsuario = async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Usuario eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar usuario" });
  }
};
