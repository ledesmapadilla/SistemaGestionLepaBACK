import EntregaEPP from "../models/entregaEPP.js";

// CREATE - registrar nueva entrega de EPP
export const crearEntregaEPP = async (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      const nuevasEntregas = await EntregaEPP.insertMany(req.body);
      return res.status(201).json({
        msg: "Entregas de EPP registradas correctamente",
        entregas: nuevasEntregas,
      });
    }
    const nuevaEntrega = new EntregaEPP(req.body);
    await nuevaEntrega.save();
    res.status(201).json({
      msg: "Entrega de EPP registrada correctamente",
      entrega: nuevaEntrega,
    });
  } catch (error) {
    console.error("Error al registrar entrega de EPP:", error);
    res.status(500).json({ msg: "Error al registrar la entrega de EPP", detalle: error.message });
  }
};

// READ - obtener entregas (opcionalmente filtrado por personal)
export const obtenerEntregasEPP = async (req, res) => {
  try {
    const { personal } = req.query;
    let filtros = {};

    if (personal) {
      filtros.personal = personal;
    }

    const entregas = await EntregaEPP.find(filtros).sort({ fecha: -1 });
    res.status(200).json(entregas);
  } catch (error) {
    console.error("Error al obtener entregas de EPP:", error);
    res.status(500).json({ msg: "Error al obtener las entregas de EPP", detalle: error.message });
  }
};

// UPDATE - editar entrega de EPP
export const editarEntregaEPP = async (req, res) => {
  try {
    const entregaActualizada = await EntregaEPP.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!entregaActualizada) {
      return res.status(404).json({ msg: "Entrega no encontrada" });
    }
    res.status(200).json({
      msg: "Entrega de EPP actualizada",
      entrega: entregaActualizada,
    });
  } catch (error) {
    console.error("Error al editar entrega de EPP:", error);
    res.status(500).json({ msg: "Error al editar la entrega de EPP", detalle: error.message });
  }
};

// DELETE - eliminar entrega de EPP
export const eliminarEntregaEPP = async (req, res) => {
  try {
    const entregaEliminada = await EntregaEPP.findByIdAndDelete(req.params.id);
    if (!entregaEliminada) {
      return res.status(404).json({ msg: "Entrega no encontrada" });
    }
    res.status(200).json({ msg: "Entrega de EPP eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar entrega de EPP:", error);
    res.status(500).json({ msg: "Error al eliminar la entrega de EPP", detalle: error.message });
  }
};
