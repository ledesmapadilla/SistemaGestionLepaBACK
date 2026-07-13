import FacturaProveedor from "../models/facturaProveedor.js";
import PagoProveedor from "../models/pagoProveedor.js";

const totalFactura = (f) =>
  f.tipoFactura === "Factura X" || f.tipoFactura === "Factura B" ? f.total : f.total * 1.21;

export const obtenerCuentaCorrienteProveedor = async (req, res) => {
  try {
    const { proveedor } = req.query;

    if (!proveedor) {
      // Optimización: Si no se especifica proveedor, devolvemos un resumen agregado para la pantalla principal.
      // Esto evita cargar miles de documentos y transferir gigabytes de datos innecesarios.
      const totalFacturaExpr = {
        $cond: [
          { $in: ["$tipoFactura", ["Factura X", "Factura B"]] },
          "$total",
          { $multiply: ["$total", 1.21] }
        ]
      };

      const [facturasAgg, pagosAgg] = await Promise.all([
        FacturaProveedor.aggregate([
          {
            $group: {
              _id: "$proveedor",
              debito: {
                $sum: {
                  $cond: [
                    { $eq: ["$tipoFactura", "Nota de Crédito"] },
                    0,
                    totalFacturaExpr
                  ]
                }
              },
              credito: {
                $sum: {
                  $cond: [
                    { $eq: ["$tipoFactura", "Nota de Crédito"] },
                    { $abs: totalFacturaExpr },
                    0
                  ]
                }
              }
            }
          }
        ]),
        PagoProveedor.aggregate([
          {
            $project: {
              proveedor: 1,
              montoPago: { $sum: "$mediosPago.monto" }
            }
          },
          {
            $group: {
              _id: "$proveedor",
              credito: { $sum: "$montoPago" }
            }
          }
        ])
      ]);

      const resumen = {};
      facturasAgg.forEach((f) => {
        if (!f._id) return;
        resumen[f._id] = {
          proveedor: f._id,
          debito: f.debito || 0,
          credito: f.credito || 0,
        };
      });

      pagosAgg.forEach((p) => {
        if (!p._id) return;
        if (!resumen[p._id]) {
          resumen[p._id] = {
            proveedor: p._id,
            debito: 0,
            credito: 0,
          };
        }
        resumen[p._id].credito += p.credito || 0;
      });

      // Creamos la lista resumen simulando los movimientos individuales que espera el front
      const listaResumen = Object.values(resumen).map((r) => ({
        proveedor: r.proveedor,
        debito: r.debito,
        credito: r.credito,
        tipo: "Factura", // Dummy para complacer al mapeo del front
        fecha: "2000-01-01",
      }));

      return res.status(200).json(listaResumen);
    }

    // Detalle de un proveedor específico (Optimizado con índice por proveedor)
    const filtro = { proveedor };
    const [facturas, pagos] = await Promise.all([
      FacturaProveedor.find(filtro).sort({ fecha: 1 }).lean(),
      PagoProveedor.find(filtro).sort({ fecha: 1 }).populate({ path: "pagos.factura", select: "numeroFactura" }).lean(),
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
      const totalPagado = (p.mediosPago || []).reduce((sum, m) => sum + (m.monto || 0), 0);
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
