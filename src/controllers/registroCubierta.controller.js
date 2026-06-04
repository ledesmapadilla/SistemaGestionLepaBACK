import RegistroCubierta from "../models/registroCubierta.js";
import "../models/cubierta.js";  // registrar modelo para populate
import "../models/maquina.js";   // registrar modelo para populate

export const crearRegistro = async (req, res) => {
  try {
    const yaExiste = await RegistroCubierta.findOne({ cubierta: req.body.cubierta });
    if (yaExiste) return res.status(400).json({ msg: "Esta cubierta ya está registrada." });

    const nuevo = new RegistroCubierta(req.body);
    await nuevo.save();
    const populado = await RegistroCubierta.findById(nuevo._id)
      .populate("cubierta", "nombreCubierta marca")
      .populate("maquina", "maquina");
    res.status(201).json({ msg: "Registro creado correctamente", registro: populado });
  } catch (error) {
    console.error("[crearRegistro cubierta] ERROR:", error.name, error.message, error.stack);
    res.status(500).json({ msg: "Error al crear registro de cubierta", error: error.message });
  }
};

export const obtenerRegistros = async (req, res) => {
  try {
    const registros = await RegistroCubierta.find()
      .select("-historial")
      .populate("cubierta", "nombreCubierta")
      .populate("maquina", "maquina")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(registros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener registros de cubiertas", error: error.message });
  }
};

export const obtenerHistorial = async (req, res) => {
  try {
    const registro = await RegistroCubierta.findById(req.params.id)
      .select("historial")
      .populate("historial.maquina", "maquina")
      .lean();
    if (!registro) return res.status(404).json({ msg: "Registro no encontrado" });
    res.status(200).json({ historial: registro.historial || [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener historial" });
  }
};

export const editarRegistro = async (req, res) => {
  try {
    const registro = await RegistroCubierta.findById(req.params.id);
    if (!registro) return res.status(404).json({ msg: "Registro no encontrado" });

    registro.historial.push({
      maquina:       registro.maquina,
      maquinaLabel:  registro.maquinaLabel,
      fecha:         registro.fecha,
      observaciones: registro.observaciones,
      editadoEn:     new Date(),
    });
    registro.markModified('historial');

    const { maquina, maquinaLabel, fecha, observaciones } = req.body;
    if (maquina       !== undefined) registro.maquina       = maquina || null;
    if (maquinaLabel  !== undefined) registro.maquinaLabel  = maquinaLabel;
    if (fecha         !== undefined) registro.fecha         = fecha;
    if (observaciones !== undefined) registro.observaciones = observaciones;

    await registro.save();

    const actualizado = await RegistroCubierta.findById(req.params.id)
      .populate("cubierta", "nombreCubierta marca")
      .populate("maquina", "maquina")
      .populate("historial.maquina", "maquina");

    res.status(200).json({ msg: "Registro actualizado", registro: actualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar registro de cubierta" });
  }
};

export const eliminarRegistro = async (req, res) => {
  try {
    const eliminado = await RegistroCubierta.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ msg: "Registro no encontrado" });
    res.status(200).json({ msg: "Registro eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar registro de cubierta" });
  }
};
