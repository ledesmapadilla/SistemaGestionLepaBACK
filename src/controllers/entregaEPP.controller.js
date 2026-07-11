import EntregaEPP from "../models/entregaEPP.js";

// CREATE - registrar nueva entrega de EPP
export const crearEntregaEPP = async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];

    // Validar cada elemento
    for (const item of items) {
      if (!item.personal) {
        return res.status(400).json({ msg: "El nombre del personal es requerido." });
      }
      if (!item.fecha) {
        return res.status(400).json({ msg: "La fecha de entrega es requerida." });
      }
      if (!item.epp) {
        return res.status(400).json({ msg: "El tipo de EPP es requerido." });
      }
      if (!item.cantidad || item.cantidad < 1) {
        return res.status(400).json({ msg: `La cantidad para ${item.epp} debe ser al menos 1.` });
      }
      if (item.epp === "otros" && (!item.observaciones || !item.observaciones.trim())) {
        return res.status(400).json({ msg: 'Debe especificar el elemento en las observaciones para "Otros".' });
      }
    }

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

// READ - obtener entregas (opcionalmente filtrado por personal y/o rango de fechas)
export const obtenerEntregasEPP = async (req, res) => {
  try {
    const { personal, desde, hasta } = req.query;
    let filtros = {};

    if (personal) {
      filtros.personal = personal;
    }

    if (desde || hasta) {
      filtros.fecha = {};
      if (desde) filtros.fecha.$gte = desde;
      if (hasta) filtros.fecha.$lte = hasta;
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
