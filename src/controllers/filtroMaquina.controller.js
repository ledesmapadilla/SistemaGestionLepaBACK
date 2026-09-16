import FiltroMaquina from "../models/filtroMaquina.js";

export const TIPOS_FILTRO = ["aceite", "combustible", "trampaAgua", "hidraulico"];

// Descarta las filas vacías del modal (marca y código en blanco).
const limpiarItems = (items) =>
  (Array.isArray(items) ? items : [])
    .map((i) => ({ marca: (i?.marca || "").trim(), codigo: (i?.codigo || "").trim() }))
    .filter((i) => i.marca || i.codigo);

export const obtenerFiltros = async (req, res) => {
  try {
    const filtros = await FiltroMaquina.find()
      .populate("maquina", "maquina")
      .lean();
    res.status(200).json(filtros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener filtros", error: error.message });
  }
};

// Alta y edición van por el mismo endpoint: se hace upsert por máquina y solo
// se pisa el tipo de filtro que vino en el body, para no borrar los otros tres.
export const guardarFiltro = async (req, res) => {
  try {
    const { maquina, tipo, items, observaciones } = req.body;
    if (!maquina) return res.status(400).json({ msg: "La máquina es obligatoria." });
    if (!TIPOS_FILTRO.includes(tipo)) return res.status(400).json({ msg: "Tipo de filtro inválido." });

    const limpios = limpiarItems(items);
    if (!limpios.length) return res.status(400).json({ msg: "Cargá al menos una marca con su código." });

    const marcas = limpios.map((i) => i.marca.toLowerCase()).filter(Boolean);
    if (new Set(marcas).size !== marcas.length) {
      return res.status(400).json({ msg: "Las marcas tienen que ser distintas entre sí." });
    }

    const set = { [tipo]: limpios };
    if (observaciones !== undefined) set.observaciones = (observaciones || "").trim();

    const filtro = await FiltroMaquina.findOneAndUpdate(
      { maquina },
      { $set: set },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("maquina", "maquina");

    res.status(200).json({ msg: "Filtros guardados correctamente", filtro });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ msg: "Ya existen filtros cargados para esa máquina." });
    }
    console.error(error);
    res.status(500).json({ msg: "Error al guardar filtros", error: error.message });
  }
};

// Borra un tipo de filtro puntual; si la máquina queda sin ninguno, se elimina el documento.
export const eliminarTipoFiltro = async (req, res) => {
  try {
    const { tipo } = req.params;
    if (!TIPOS_FILTRO.includes(tipo)) return res.status(400).json({ msg: "Tipo de filtro inválido." });

    const filtro = await FiltroMaquina.findById(req.params.id);
    if (!filtro) return res.status(404).json({ msg: "Registro no encontrado" });

    filtro[tipo] = [];
    if (TIPOS_FILTRO.every((t) => !filtro[t].length)) {
      await filtro.deleteOne();
      return res.status(200).json({ msg: "Registro eliminado" });
    }
    await filtro.save();
    res.status(200).json({ msg: "Filtro eliminado", filtro });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar filtro", error: error.message });
  }
};

export const eliminarFiltro = async (req, res) => {
  try {
    const eliminado = await FiltroMaquina.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ msg: "Registro no encontrado" });
    res.status(200).json({ msg: "Registro eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar registro", error: error.message });
  }
};
