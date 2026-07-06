import Factura from "../models/factura.js";
import Cobro from "../models/cobro.js";

const calcularTotalConIva = (f) =>
  f.tipoFactura === "Factura X" ? f.total : f.total * 1.21;

export const obtenerCuentaCorriente = async (req, res) => {
  try {
    const { cliente } = req.query;
    const filtro = cliente ? { cliente } : {};

    const [facturas, cobros] = await Promise.all([
      Factura.find(filtro)
        .select("fecha tipoFactura numeroFactura cliente remitos total estadoPago facturaAsociada")
        .populate({
          path: "remitos",
          select: "obra",
          populate: { path: "obra", select: "nombreobra" },
        })
        .sort({ fecha: 1 })
        .lean(),
      Cobro.find(filtro)
        .select("fecha cliente medioPago mediosPago pagos")
        .populate({ path: "pagos.factura", select: "numeroFactura" })
        .sort({ fecha: 1 })
        .lean(),
    ]);

    const movFacturas = facturas.map((f) => {
      const monto = calcularTotalConIva(f);
      const esNota = f.tipoFactura === "Nota de Crédito";
      const obras = [
        ...new Set(
          (f.remitos || []).map((r) => r.obra?.nombreobra).filter(Boolean)
        ),
      ];
      // La Nota de Crédito muestra entre paréntesis la factura que anula.
      const descripcion =
        esNota && f.facturaAsociada
          ? `${f.tipoFactura} - N° ${f.numeroFactura} (Factura N° ${f.facturaAsociada})`
          : `${f.tipoFactura} - N° ${f.numeroFactura}`;
      return {
        _id: f._id,
        fecha: f.fecha,
        cliente: f.cliente,
        tipo: "Factura",
        descripcion,
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
      const numeros = [
        ...new Set(
          (c.pagos || []).map((p) => p.factura?.numeroFactura).filter(Boolean)
        ),
      ];
      const nroStr = numeros.length > 0 ? `Factura N° ${numeros.join(", ")} - ` : "";
      return {
        _id: c._id,
        fecha: c.fecha,
        cliente: c.cliente,
        tipo: "Cobro",
        descripcion: `${nroStr}${medios}`,
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
