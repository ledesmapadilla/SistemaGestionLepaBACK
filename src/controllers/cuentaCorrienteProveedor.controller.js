import FacturaProveedor from "../models/facturaProveedor.js";
import PagoProveedor from "../models/pagoProveedor.js";

const totalFactura = (f) =>
  f.tipoFactura === "Factura X" || f.tipoFactura === "Factura B" ? f.total : f.total * 1.21;

export const obtenerCuentaCorrienteProveedor = async (req, res) => {
  try {
    const { proveedor } = req.query;
    const filtro = proveedor ? { proveedor } : {};

    let queryFacturas = FacturaProveedor.find(filtro).sort({ fecha: 1 }).lean();
    let queryPagos = PagoProveedor.find(filtro).sort({ fecha: 1 }).lean();

    if (proveedor) {
      queryPagos = queryPagos.populate({ path: "pagos.factura", select: "numeroFactura" });
    }

    const [facturas, pagos] = await Promise.all([
      queryFacturas,
      queryPagos,
    ]);

    const movFacturas = facturas.map((f) => {
      const monto = totalFactura(f);
      const esNota = f.tipoFactura === "Nota de Crédito";
      return {
        _id: f._id,
        fecha: f.fecha,
        proveedor: f.proveedor,
        tipo: "Factura",
        numeroFactura: `${f.tipoFactura} - N° ${f.numeroFactura}`,
        descripcion: f.concepto || "-",
        obra: f.obra || "",
        debito: esNota ? 0 : monto,
        credito: esNota ? Math.abs(monto) : 0,
      };
    });

    const movPagos = pagos.map((p) => {
      const totalPagado = (p.pagos || []).reduce((sum, i) => sum + (i.montoPagado || 0), 0);
      const medios = (p.mediosPago || []).map((m) => m.medioPago).join(", ") || "-";
      const numeros = [
        ...new Set((p.pagos || []).map((i) => i.factura?.numeroFactura).filter(Boolean)),
      ];
      return {
        _id: p._id,
        fecha: p.fecha,
        proveedor: p.proveedor,
        tipo: "Pago",
        numeroFactura: numeros.length > 0 ? numeros.join(", ") : "-",
        descripcion: medios,
        obra: "",
        debito: 0,
        credito: totalPagado,
      };
    });

    const movimientos = [...movFacturas, ...movPagos].sort((a, b) => {
      const diff = new Date(a.fecha) - new Date(b.fecha);
      if (diff !== 0) return diff;
      return a.tipo === "Factura" ? -1 : 1;
    });

    res.status(200).json(movimientos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener cuenta corriente de proveedores" });
  }
};
