import Factura from "../models/factura.js";
import Remito from "../models/remito.js";
import {
  calcularMontosFacturados,
  calcularTotalRemito,
  sincronizarRemitos,
} from "../helpers/montoFacturado.js";

export const obtenerFacturas = async (req, res) => {
  try {
    // De cada remito solo lo que usan las pantallas (número, fecha, total por
    // ítems y nombre de la obra). Traer los remitos y las obras completas
    // (con el array de precios) hacía pesar el listado varias veces más.
    const facturas = await Factura.find()
      .populate({
        path: "remitos",
        select: "remito fecha estado montoFacturado obra items.fecha items.cantidad items.precioUnitario",
        populate: { path: "obra", select: "nombreobra razonsocial" },
      })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(facturas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener facturas" });
  }
};

// El montoFacturado y el estado de los remitos NUNCA se suman/restan acá: se
// recalculan desde las facturas vigentes con sincronizarRemitos (ver
// helpers/montoFacturado.js). Así da igual en qué orden se carguen facturas y
// notas de crédito.

// Factura original (no NC) a la que apunta una NC: mismo cliente y número.
const buscarOriginal = (cliente, numero) =>
  Factura.findOne({
    cliente,
    numeroFactura: numero,
    tipoFactura: { $ne: "Nota de Crédito" },
  });

const remitosAfectados = (...facturas) =>
  facturas.flatMap((f) => (f?.remitos || []).map(String));

// Si ninguna otra NC sigue apuntando a la factura, deja de estar anulada.
const restaurarSiNoTieneNC = async (original, excluirNcId) => {
  if (!original || original.estadoPago !== "Anulada") return;
  const otraNC = await Factura.exists({
    _id: { $ne: excluirNcId },
    tipoFactura: "Nota de Crédito",
    cliente: original.cliente,
    facturaAsociada: original.numeroFactura,
  });
  if (!otraNC) await Factura.updateOne({ _id: original._id }, { estadoPago: "Pendiente" });
};

export const crearFactura = async (req, res) => {
  try {
    const { fecha, tipoFactura, numeroFactura, cliente, remitos, total, montosPorRemito, estadoPago, facturaAsociada } = req.body;
    const esNotaCredito = tipoFactura === "Nota de Crédito";

    if (!esNotaCredito && Array.isArray(remitos) && remitos.length > 0) {
      // Un remito con total $0 no se puede facturar: quedaría marcado
      // "Facturado" por un importe de cero y, a partir de ahí, bloqueado. Es el
      // caso del remito automático de una obra de precio cerrado a la que
      // todavía no se le cargó el precio: primero hay que definirlo en la obra.
      const aFacturar = await Remito.find({ _id: { $in: remitos } })
        .select("remito items")
        .lean();
      const sinPrecio = aFacturar.filter(
        (r) => Math.round(calcularTotalRemito(r.items) * 100) / 100 <= 0
      );
      if (sinPrecio.length > 0) {
        const numeros = sinPrecio.map((r) => `N° ${r.remito}`).join(", ");
        return res.status(400).json({
          msg: `El remito ${numeros} no tiene precio cargado (total $0) y no se puede facturar. Cargá el precio en la obra y volvé a intentar.`,
        });
      }

      // No se factura dos veces lo mismo: lo pedido para cada remito no puede
      // pasar su saldo pendiente según las facturas vigentes. Para refacturar,
      // primero va la nota de crédito de la factura anterior.
      const actuales = await calcularMontosFacturados(remitos);
      const excedidos = aFacturar.filter((r) => {
        const actual = actuales[String(r._id)];
        if (!actual) return false;
        const entrada = (montosPorRemito || []).find((m) => String(m.remitoId) === String(r._id));
        const pedido = entrada ? Number(entrada.monto) || 0 : actual.total;
        return pedido > actual.total - actual.monto + 1;
      });
      if (excedidos.length > 0) {
        const numeros = excedidos.map((r) => `N° ${r.remito}`).join(", ");
        return res.status(400).json({
          msg: `El remito ${numeros} ya está facturado (o el monto supera su saldo pendiente). Si lo estás refacturando, primero cargá la nota de crédito de la factura anterior.`,
        });
      }
    }

    let original = null;
    if (esNotaCredito && facturaAsociada) {
      original = await buscarOriginal(cliente, facturaAsociada).select("remitos").lean();
      if (!original) {
        return res.status(400).json({
          msg: `No existe la factura ${facturaAsociada} de ${cliente} para asociarle la nota de crédito.`,
        });
      }
    }

    const nuevaFactura = new Factura({
      fecha, tipoFactura, numeroFactura, cliente, remitos, total,
      montosPorRemito: montosPorRemito || [],
      ...(estadoPago && { estadoPago }),
      ...(facturaAsociada && { facturaAsociada }),
    });
    await nuevaFactura.save();

    if (original) await Factura.updateOne({ _id: original._id }, { estadoPago: "Anulada" });

    await sincronizarRemitos(remitosAfectados(nuevaFactura, original));

    res.status(201).json({ msg: "Factura creada correctamente", factura: nuevaFactura });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear factura" });
  }
};

export const editarFactura = async (req, res) => {
  try {
    const anterior = await Factura.findById(req.params.id).lean();
    if (!anterior) {
      return res.status(404).json({ msg: "Factura no encontrada" });
    }

    const cambios = req.body;
    const tipo = cambios.tipoFactura ?? anterior.tipoFactura;
    const numero = cambios.numeroFactura ?? anterior.numeroFactura;
    const asociada = tipo === "Nota de Crédito"
      ? (cambios.facturaAsociada ?? anterior.facturaAsociada ?? "")
      : "";

    // Una factura con nota de crédito está anulada: no se puede pasar a
    // Pendiente/Pagada mientras exista la NC (hay que borrar la NC).
    if (anterior.tipoFactura !== "Nota de Crédito" && cambios.estadoPago && cambios.estadoPago !== "Anulada") {
      const tieneNC = await Factura.exists({
        tipoFactura: "Nota de Crédito",
        cliente: anterior.cliente,
        facturaAsociada: anterior.numeroFactura,
      });
      if (tieneNC) {
        return res.status(400).json({
          msg: "La factura tiene una nota de crédito asociada y está anulada. Para reactivarla, borrá la nota de crédito.",
        });
      }
    }

    let nuevaOriginal = null;
    if (tipo === "Nota de Crédito" && asociada && asociada !== anterior.facturaAsociada) {
      nuevaOriginal = await buscarOriginal(anterior.cliente, asociada).lean();
      if (!nuevaOriginal) {
        return res.status(400).json({
          msg: `No existe la factura ${asociada} de ${anterior.cliente} para asociarle la nota de crédito.`,
        });
      }
    }

    const facturaActualizada = await Factura.findByIdAndUpdate(
      req.params.id,
      cambios,
      { new: true, runValidators: true }
    );

    const afectados = remitosAfectados(anterior, facturaActualizada);

    // Si se renumera una factura, sus NC la siguen apuntando.
    if (anterior.tipoFactura !== "Nota de Crédito" && numero !== anterior.numeroFactura) {
      await Factura.updateMany(
        { tipoFactura: "Nota de Crédito", cliente: anterior.cliente, facturaAsociada: anterior.numeroFactura },
        { facturaAsociada: numero }
      );
    }

    // NC que cambia (o deja) de factura asociada: la anterior se reactiva.
    if (anterior.tipoFactura === "Nota de Crédito" && anterior.facturaAsociada &&
        (tipo !== "Nota de Crédito" || asociada !== anterior.facturaAsociada)) {
      const vieja = await buscarOriginal(anterior.cliente, anterior.facturaAsociada).lean();
      await restaurarSiNoTieneNC(vieja, anterior._id);
      afectados.push(...remitosAfectados(vieja));
    }
    if (nuevaOriginal) {
      await Factura.updateOne({ _id: nuevaOriginal._id }, { estadoPago: "Anulada" });
      afectados.push(...remitosAfectados(nuevaOriginal));
    }

    await sincronizarRemitos(afectados);

    res.status(200).json({ msg: "Factura actualizada", factura: facturaActualizada });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar factura" });
  }
};

export const eliminarFactura = async (req, res) => {
  try {
    const factura = await Factura.findById(req.params.id).lean();
    if (!factura) {
      return res.status(404).json({ msg: "Factura no encontrada" });
    }

    const esNotaCredito = factura.tipoFactura === "Nota de Crédito";
    let original = null;
    if (esNotaCredito && factura.facturaAsociada) {
      original = await buscarOriginal(factura.cliente, factura.facturaAsociada).lean();
      await restaurarSiNoTieneNC(original, factura._id);
    }

    await Factura.findByIdAndDelete(req.params.id);
    await sincronizarRemitos(remitosAfectados(factura, original));

    res.status(200).json({
      msg: esNotaCredito ? "Nota de crédito eliminada correctamente" : "Factura eliminada correctamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar factura" });
  }
};
