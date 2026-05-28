import RegistroBateria from "../models/registroBateria.js";
import "../models/bateria.js";   // registrar modelo para populate
import "../models/maquina.js";   // registrar modelo para populate

export const crearRegistro = async (req, res) => {
  try {
    console.log("[crearRegistro] body recibido:", JSON.stringify(req.body));
    const nuevo = new RegistroBateria(req.body);
    await nuevo.save();
    res.status(201).json({ msg: "Registro creado correctamente", registro: nuevo });
  } catch (error) {
    console.error("[crearRegistro] ERROR:", error.name, error.message, error.stack);
    res.status(500).json({
      msg: "Error al crear registro de batería",
      error: error.message,
      name: error.name,
      kind: error.kind || null,
    });
  }
};

export const obtenerRegistros = async (req, res) => {
  try {
    const registros = await RegistroBateria.find()
      .populate("bateria", "nombreBateria marca")
      .populate("maquina", "maquina")
      .populate("historial.maquina", "maquina")
      .sort({ createdAt: -1 });
    res.status(200).json(registros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener registros de baterías", error: error.message });
  }
};

export const editarRegistro = async (req, res) => {
  try {
    const registro = await RegistroBateria.findById(req.params.id);
    if (!registro) return res.status(404).json({ msg: "Registro no encontrado" });

    registro.historial.push({
      maquina:       registro.maquina,
      maquinaLabel:  registro.maquinaLabel,
      fecha:         registro.fecha,
      observaciones: registro.observaciones,
      editadoEn:     new Date(),
    });

    const { maquina, maquinaLabel, fecha, observaciones } = req.body;
    if (maquina       !== undefined) registro.maquina       = maquina || null;
    if (maquinaLabel  !== undefined) registro.maquinaLabel  = maquinaLabel;
    if (fecha         !== undefined) registro.fecha         = fecha;
    if (observaciones !== undefined) registro.observaciones = observaciones;

    await registro.save();

    const actualizado = await RegistroBateria.findById(req.params.id)
      .populate("bateria", "nombreBateria marca")
      .populate("maquina", "maquina")
      .populate("historial.maquina", "maquina");

    res.status(200).json({ msg: "Registro actualizado", registro: actualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar registro de batería" });
  }
};

export const eliminarRegistro = async (req, res) => {
  try {
    const eliminado = await RegistroBateria.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ msg: "Registro no encontrado" });
    res.status(200).json({ msg: "Registro eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar registro de batería" });
  }
};
