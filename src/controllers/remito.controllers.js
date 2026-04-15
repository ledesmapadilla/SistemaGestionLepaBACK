import Remito from "../models/remito.js";

export const crearRemito = async (req, res) => {
  try {
    const { remito, estado, obra, fecha, items } = req.body;

    if (!remito || !estado || !obra || !fecha) {
      return res.status(400).json({ msg: "Faltan datos obligatorios" });
    }

    if (!items || !items.length) {
      return res.status(400).json({ msg: "Debe haber al menos un item" });
    }

    const remitoNuevo = new Remito({
      remito: Number(remito),
      estado,
      obra,
      fecha, // string YYYY-MM-DD directamente
      items: items.map((item) => ({
        fecha: item.fecha, //  string YYYY-MM-DD directamente
        personal: item.personal || "",
        maquina: item.maquina || "",
        servicio: item.servicio || "",
        cantidad: Number(item.cantidad),
        unidad: item.unidad || "",
        precioUnitario: Number(item.precioUnitario),
        costoHoraPersonal: Number(item.costoHoraPersonal || 0),
        gasoil: Number(item.gasoil || 0),
        observaciones: item.observaciones || "",
      })),
    });

    await remitoNuevo.save();

    res.status(201).json({
      msg: "Remito creado correctamente",
      remito: remitoNuevo,
    });
  } catch (error) {
    console.error("ERROR CREAR REMITO:", error);

    // Error de índice UNIQUE (obra + remito)
    if (error.code === 11000) {
      return res.status(400).json({
        msg: "Ya existe un remito con ese número para esta obra",
      });
    }

    res.status(500).json({
      msg: "Error interno al crear remito",
    });
  }
};

// DELETE /remitos/:remitoId/items/:itemId
export const eliminarItemRemito = async (req, res) => {
  try {
    const { remitoId, itemId } = req.params;

    const remitoActualizado = await Remito.findByIdAndUpdate(
      remitoId,
      { $pull: { items: { _id: itemId } } },
      { new: true }
    );

    if (!remitoActualizado) {
      return res.status(404).json({ msg: "Remito no encontrado" });
    }

    // SI EL REMITO SE QUEDÓ SIN ITEMS, BORRARLO COMPLETAMENTE
    if (remitoActualizado.items.length === 0) {
      await Remito.findByIdAndDelete(remitoId);
      return res.status(200).json({
        msg: "Remito eliminado porque no contenía más ítems",
        remito: null, // Indicar al front que ya no existe
      });
    }

    res.status(200).json({
      msg: "Item eliminado correctamente",
      remito: remitoActualizado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar item del remito" });
  }
};

/*
| GET /remitos?obra=ID&estado=xxx
*/
export const obtenerRemitos = async (req, res) => {
  try {
    const { obra, estado } = req.query;

    const filtros = {};
    if (obra) filtros.obra = obra;
    if (estado) filtros.estado = { $regex: `^${estado}$`, $options: "i" };

    const remitos = await Remito.find(filtros)
      .populate("obra")
      .sort({ createdAt: -1 });

    //  Blindaje
    const remitosSeguros = remitos.map((r) => ({
      ...r.toObject(),
      items: r.items || [],
    }));

    res.status(200).json(remitosSeguros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener remitos" });
  }
};

/*
| PUT /remitos/:id
*/
export const editarRemito = async (req, res) => {
  try {
    //  RECALCULAR TOTAL SI CAMBIAN DATOS
    if (req.body.cantidad && req.body.precioUnitario) {
      req.body.total =
        Number(req.body.cantidad) * Number(req.body.precioUnitario);
    }

    const remitoActualizado = await Remito.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!remitoActualizado) {
      return res.status(404).json({ msg: "Remito no encontrado" });
    }

    res.status(200).json({
      msg: "Remito actualizado correctamente",
      remito: remitoActualizado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar remito" });
  }
};

export const editarItemRemito = async (req, res) => {
  try {
    const { remitoId, itemId } = req.params;
    const datos = req.body;

    const remito = await Remito.findById(remitoId);
    if (!remito) {
      return res.status(404).json({ msg: "Remito no encontrado" });
    }

    // ACTUALIZAR ESTADO DEL REMITO (PADRE)
    if (datos.estado) {
      remito.estado = datos.estado;
    }

    const item = remito.items.id(itemId);
    if (!item) {
      return res.status(404).json({ msg: "Item no encontrado" });
    }

    if (datos.fecha) {
      item.fecha = datos.fecha; //  string YYYY-MM-DD directo
    }

    if (datos.maquina !== undefined) item.maquina = datos.maquina;
    if (datos.servicio !== undefined) item.servicio = datos.servicio;
    if (datos.personal !== undefined) item.personal = datos.personal;
    if (datos.cantidad !== undefined) item.cantidad = Number(datos.cantidad);
    if (datos.precioUnitario !== undefined)
      item.precioUnitario = Number(datos.precioUnitario);
    if (datos.unidad !== undefined) item.unidad = datos.unidad;
    if (datos.costoHoraPersonal !== undefined)
      item.costoHoraPersonal = Number(datos.costoHoraPersonal);
    if (datos.gasoil !== undefined) item.gasoil = Number(datos.gasoil);
    if (datos.observaciones !== undefined) item.observaciones = datos.observaciones;

    await remito.save();

    res.json({
      msg: "Ítem actualizado correctamente",
      remito,
    });
  } catch (error) {
    console.error("ERROR AL EDITAR ITEM:", error);
    res.status(500).json({ msg: "Error al editar el ítem" });
  }
};

/*
| DELETE /remitos/:id
*/
export const eliminarRemito = async (req, res) => {
  try {
    const remitoEliminado = await Remito.findByIdAndDelete(req.params.id);

    if (!remitoEliminado) {
      return res.status(404).json({ msg: "Remito no encontrado" });
    }

    res.status(200).json({ msg: "Remito eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar remito" });
  }
};
