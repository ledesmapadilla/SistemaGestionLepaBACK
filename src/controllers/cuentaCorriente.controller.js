import Factura from "../models/factura.js";
import Cobro from "../models/cobro.js";

const calcularTotalConIva = (f) =>
  f.tipoFactura === "Factura X" ? f.total : f.total * 1.21;

export const obtenerCuentaCorriente = async (req, res) => {
  try {
    const [facturas, cobros] = await Promise.all([
      Factura.find()
        .populate({ path: "remitos", populate: { path: "obra" } })
        .sort({ fecha: 1 }),
      Cobro.find().sort({ fecha: 1 }),
    ]);

    const movFacturas = facturas.map((f) => {
      const monto = calcularTotalConIva(f);
      const esNota = f.tipoFactura === "Nota de Crédito";
      const obras = [
        ...new Set(
          (f.remitos || []).map((r) => r.obra?.nombreobra).filter(Boolean)
        ),
      ];
      return {
        _id: f._id,
        fecha: f.fecha,
        cliente: f.cliente,
        tipo: "Factura",
        descripcion: `${f.tipoFactura} N° ${f.numeroFactura}`,
        obras,
        debito: esNota ? 0 : monto,
        credito: esNota ? Math.abs(monto) : 0,
        estadoPago: f.estadoPago,
      };
    });

    const movCobros = cobros.map((c) => {
      const totalCobrado = (c.pagos || []).reduce(
        (sum, p) => sum + (p.montoCobrado || 0),
        0
      );
      const medios =
        c.mediosPago?.length > 0
          ? c.mediosPago.map((m) => m.medioPago).join(", ")
          : c.medioPago || "-";
      return {
        _id: c._id,
        fecha: c.fecha,
        cliente: c.cliente,
        tipo: "Cobro",
        descripcion: medios,
        obras: [],
        debito: 0,
        credito: totalCobrado,
      };
    });

    const movimientos = [...movFacturas, ...movCobros].sort((a, b) => {
      const diff = new Date(a.fecha) - new Date(b.fecha);
      if (diff !== 0) return diff;
      return a.tipo === "Factura" ? -1 : 1;
    });

    res.status(200).json(movimientos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener cuenta corriente" });
  }
};
