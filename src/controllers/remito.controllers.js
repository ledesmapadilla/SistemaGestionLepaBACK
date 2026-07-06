import Remito from "../models/remito.js";

const calcTotal = (items = []) =>
  items.reduce((s, i) => s + Number(i.cantidad) * Number(i.precioUnitario), 0);

export const recalcularEstados = async (req, res) => {
  try {
    const remitos = await Remito.find({ estado: "Sin facturar", montoFacturado: { $gt: 0 } });
    let corregidos = 0;
    for (const r of remitos) {
      const total = Math.round(calcTotal(r.items) * 100) / 100;
      if (total - (r.montoFacturado || 0) < 1) {
        await Remito.findByIdAndUpdate(r._id, { $set: { estado: "Facturado" } });
        corregidos++;
      }
    }
    res.status(200).json({ msg: `${corregidos} remito(s) corregido(s)`, corregidos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al recalcular estados" });
  }
};

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
| GET /remitos?disponibles=true  → remitos con saldo pendiente para facturación
*/
export const obtenerRemitos = async (req, res) => {
  try {
    const { obra, estado, disponibles } = req.query;

    const filtros = {};
    if (obra) filtros.obra = obra;

    if (disponibles === "true") {
      filtros.estado = { $nin: ["Obra propia", "Facturado"] };
    } else if (estado) {
      filtros.estado = { $regex: `^${estado}$`, $options: "i" };
    }

    let remitos = await Remito.find(filtros)
      .populate("obra")
      .sort({ createdAt: -1 });

    if (disponibles === "true") {
      remitos = remitos.filter((r) => {
        const total = Math.round((r.items || []).reduce(
          (sum, i) => sum + Number(i.cantidad) * Number(i.precioUnitario),
          0
        ) * 100) / 100;
        const saldo = Math.round((total - (r.montoFacturado || 0)) * 100) / 100;
        if (saldo > 0.001) return true;
        // Remito automático de precio cerrado/global al que todavía no se le
        // definió el precio (precioUnitario 0 → total 0): se muestra en "sin
        // facturar" hasta que se le cargue el precio y se facture.
        const esGlobalSinPrecio =
          total <= 0.001 &&
          (r.montoFacturado || 0) <= 0.001 &&
          (r.items || []).some((i) => i.servicio === "Precio de la obra");
        return esGlobalSinPrecio;
      });
    }

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
| GET /remitos/existe/:numero → { existe: bool }
| Chequeo liviano de número de remito ya usado (sin bajar toda la colección).
*/
export const existeRemito = async (req, res) => {
  try {
    const numero = Number(req.params.numero);
    if (!Number.isFinite(numero)) {
      return res.status(400).json({ msg: "Número de remito inválido" });
    }
    const existe = await Remito.exists({ remito: numero });
    res.status(200).json({ existe: !!existe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al verificar remito" });
  }
};

/*
| GET /remitos/proximo-numero?desde=9000 → { numero }
| Devuelve el próximo número libre >= desde (para remitos automáticos de obra
| propia). Solo trae los números >= desde, no toda la colección.
*/
export const proximoNumeroRemito = async (req, res) => {
  try {
    const desde = Number(req.query.desde) || 9000;
    const usados = await Remito.find({ remito: { $gte: desde } }, { remito: 1, _id: 0 }).lean();
    const set = new Set(usados.map((r) => r.remito));
    let numero = desde;
    while (set.has(numero)) numero++;
    res.status(200).json({ numero });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al calcular próximo número de remito" });
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
