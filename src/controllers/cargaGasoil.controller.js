import CargaGasoil from "../models/cargaGasoil.js";

// Valida los campos obligatorios de una carga. Devuelve el mensaje de error o
// null si está todo bien.
const validarCarga = (body) => {
  if (!body.fecha) return "La fecha es obligatoria";
  if (!body.cliente) return "El cliente es obligatorio";
  if (!body.obra) return "La obra es obligatoria";
  if (!body.maquina) return "La máquina es obligatoria";
  if (body.litros === undefined || body.litros === null || body.litros === "")
    return "Los litros son obligatorios";
  if (isNaN(Number(body.litros)) || Number(body.litros) <= 0)
    return "Los litros deben ser un número mayor a 0";
  if (!body.quienCarga) return "Indicá quién carga";
  return null;
};

// Dos clicks seguidos en Guardar mandan el mismo POST dos veces. Si ya entró
// una carga idéntica hace segundos, es eso y no una carga nueva de verdad.
const VENTANA_DUPLICADO_MS = 10000;

const buscarDuplicadaReciente = (body) =>
  CargaGasoil.findOne({
    fecha: body.fecha,
    cliente: body.cliente,
    obra: body.obra,
    maquina: body.maquina,
    litros: Number(body.litros),
    quienCarga: body.quienCarga,
    createdAt: { $gte: new Date(Date.now() - VENTANA_DUPLICADO_MS) },
  });

// CREATE
export const crearCargaGasoil = async (req, res) => {
  try {
    const error = validarCarga(req.body);
    if (error) return res.status(400).json({ msg: error });

    // Devolvemos la que ya está en vez de crear una segunda igual.
    const duplicada = await buscarDuplicadaReciente(req.body);
    if (duplicada) {
      return res.status(201).json({ msg: "Carga de gasoil creada", carga: duplicada });
    }

    const nuevaCarga = new CargaGasoil({
      ...req.body,
      litros: Number(req.body.litros),
    });
    await nuevaCarga.save();
    res.status(201).json({ msg: "Carga de gasoil creada", carga: nuevaCarga });
  } catch (error) {
    console.error("Error al crear carga de gasoil:", error);
    res.status(500).json({ msg: "Error al crear la carga de gasoil", detalle: error.message });
  }
};

// READ - listado con filtros opcionales por columna
export const obtenerCargasGasoil = async (req, res) => {
  try {
    const { desde, hasta, fecha, cliente, obra, maquina, quienCarga } = req.query;
    const filtros = {};

    if (fecha) {
      filtros.fecha = fecha;
    } else if (desde || hasta) {
      filtros.fecha = {};
      if (desde) filtros.fecha.$gte = desde;
      if (hasta) filtros.fecha.$lte = hasta;
    }

    if (cliente) filtros.cliente = cliente;
    if (obra) filtros.obra = obra;
    if (maquina) filtros.maquina = maquina;
    if (quienCarga) filtros.quienCarga = quienCarga;

    const cargas = await CargaGasoil.find(filtros).sort({ fecha: -1, createdAt: -1 }).lean();
    res.status(200).json(cargas);
  } catch (error) {
    console.error("Error al obtener cargas de gasoil:", error);
    res.status(500).json({ msg: "Error al obtener las cargas de gasoil", detalle: error.message });
  }
};

// UPDATE
export const editarCargaGasoil = async (req, res) => {
  try {
    const error = validarCarga(req.body);
    if (error) return res.status(400).json({ msg: error });

    const cargaActualizada = await CargaGasoil.findByIdAndUpdate(
      req.params.id,
      { ...req.body, litros: Number(req.body.litros) },
      { new: true }
    );
    if (!cargaActualizada) {
      return res.status(404).json({ msg: "Carga de gasoil no encontrada" });
    }
    res.status(200).json({ msg: "Carga de gasoil actualizada", carga: cargaActualizada });
  } catch (error) {
    console.error("Error al editar carga de gasoil:", error);
    res.status(500).json({ msg: "Error al editar la carga de gasoil", detalle: error.message });
  }
};

// DELETE
export const eliminarCargaGasoil = async (req, res) => {
  try {
    const cargaEliminada = await CargaGasoil.findByIdAndDelete(req.params.id);
    if (!cargaEliminada) {
      return res.status(404).json({ msg: "Carga de gasoil no encontrada" });
    }
    res.status(200).json({ msg: "Carga de gasoil eliminada" });
  } catch (error) {
    console.error("Error al eliminar carga de gasoil:", error);
    res.status(500).json({ msg: "Error al eliminar la carga de gasoil", detalle: error.message });
  }
};
