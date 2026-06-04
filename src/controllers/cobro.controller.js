import mongoose from "mongoose";
import Cobro from "../models/cobro.js";
import Factura from "../models/factura.js";

const recalcularEstadoFacturas = async (facturaIds) => {
  const ids = [...new Set(facturaIds.map((id) => id?.toString()).filter(Boolean))];
  if (!ids.length) return;

  const facturas = await Factura.find({ _id: { $in: ids } }, "_id tipoFactura total").lean();
  const facturaMap = Object.fromEntries(facturas.map((f) => [f._id.toString(), f]));

  await Promise.all(
    ids.map(async (facturaId) => {
      const factura = facturaMap[facturaId];
      if (!factura) return;
      const totalConIva = factura.tipoFactura === "Factura X" ? factura.total : factura.total * 1.21;
      const resultado = await Cobro.aggregate([
        { $unwind: "$pagos" },
        { $match: { "pagos.factura": new mongoose.Types.ObjectId(facturaId) } },
        { $group: { _id: null, total: { $sum: "$pagos.montoCobrado" } } },
      ]);
      const totalCobrado = resultado[0]?.total || 0;
      const estadoPago = totalCobrado >= totalConIva - 0.01 ? "Pagada" : "Pendiente";
      await Factura.findByIdAndUpdate(facturaId, { estadoPago });
    })
  );
};

export const recalcularTodasLasFacturas = async (req, res) => {
  try {
    const facturas = await Factura.find({}, "_id tipoFactura total");
    await recalcularEstadoFacturas(facturas.map((f) => f._id));
    res.status(200).json({ msg: `${facturas.length} facturas recalculadas correctamente` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al recalcular facturas" });
  }
};

export const obtenerCobros = async (req, res) => {
  try {
    const cobros = await Cobro.find().sort({ createdAt: -1 }).lean();

    const facturaIds = [...new Set(
      cobros.flatMap((c) => (c.pagos || []).map((p) => p.factura?.toString()).filter(Boolean))
    )];
    const facturas = await Factura.find({ _id: { $in: facturaIds } })
      .populate({ path: "remitos", populate: { path: "obra" } })
      .lean();
    const facturaMap = Object.fromEntries(facturas.map((f) => [f._id.toString(), f]));

    const cobrosPopulados = cobros.map((c) => ({
      ...c,
      pagos: (c.pagos || []).map((p) => ({
        ...p,
        factura: facturaMap[p.factura?.toString()] ?? null,
      })),
    }));

    res.status(200).json(cobrosPopulados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener cobros" });
  }
};

export const crearCobro = async (req, res) => {
  try {
    const { fecha, cliente, medioPago, mediosPago, pagos } = req.body;

    const numerosCheque = (mediosPago || [])
      .filter((m) => (m.medioPago === "Cheque" || m.medioPago === "E-Cheq") && m.numeroCheque)
      .map((m) => m.numeroCheque);

    if (numerosCheque.length > 0) {
      const duplicado = await Cobro.findOne({
        mediosPago: { $elemMatch: { medioPago: { $in: ["Cheque", "E-Cheq"] }, numeroCheque: { $in: numerosCheque } } },
      }).lean();
      if (duplicado) {
        const cheqDup = duplicado.mediosPago.find((m) => numerosCheque.includes(m.numeroCheque));
        return res.status(400).json({ msg: `El cheque N° ${cheqDup.numeroCheque} ya existe en otro cobro` });
      }
    }

    const nuevoCobro = new Cobro({ fecha, cliente, medioPago, mediosPago, pagos });
    await nuevoCobro.save();
    await recalcularEstadoFacturas((pagos || []).map((p) => p.factura));
    res.status(201).json({ msg: "Cobro registrado correctamente", cobro: nuevoCobro });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear cobro" });
  }
};

export const editarCobro = async (req, res) => {
  try {
    const cobroAnterior = await Cobro.findById(req.params.id);
    if (!cobroAnterior) return res.status(404).json({ msg: "Cobro no encontrado" });
    const idsAnteriores = (cobroAnterior.pagos || []).map((p) => p.factura);
    const cobroActualizado = await Cobro.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    const idsNuevos = ((req.body.pagos) || []).map((p) => p.factura);
    await recalcularEstadoFacturas([...idsAnteriores, ...idsNuevos]);
    res.status(200).json({ msg: "Cobro actualizado", cobro: cobroActualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar cobro" });
  }
};

export const actualizarEstadoMedioPago = async (req, res) => {
  try {
    const { cobroId, medioIndex } = req.params;
    const { estado, observaciones, proveedor, tasaInteres, gastosPorc, montoDescontado } = req.body;
    const updated = await Cobro.findByIdAndUpdate(
      cobroId,
      {
        $set: {
          [`mediosPago.${medioIndex}.estado`]: estado,
          [`mediosPago.${medioIndex}.proveedor`]: proveedor ?? "",
          [`mediosPago.${medioIndex}.tasaInteres`]: tasaInteres ?? null,
          [`mediosPago.${medioIndex}.gastosPorc`]: gastosPorc ?? null,
          [`mediosPago.${medioIndex}.montoDescontado`]: montoDescontado ?? null,
          [`mediosPago.${medioIndex}.observaciones`]: observaciones ?? "",
        },
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ msg: "Cobro no encontrado" });
    res.status(200).json({ msg: "Estado actualizado", cobro: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al actualizar estado" });
  }
};

export const eliminarCobro = async (req, res) => {
  try {
    const cobro = await Cobro.findByIdAndDelete(req.params.id);
    if (!cobro) return res.status(404).json({ msg: "Cobro no encontrado" });
    await recalcularEstadoFacturas((cobro.pagos || []).map((p) => p.factura));
    res.status(200).json({ msg: "Cobro eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar cobro" });
  }
};
