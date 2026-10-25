import mongoose from "mongoose";

const medioPagoSchema = new mongoose.Schema(
  {
    // "Saldo a favor" no es plata nueva: aplica el saldo que el cliente dejó
    // en cobros anteriores (ver helpers/saldoAFavor.js).
    medioPago: {
      type: String,
      enum: ["Efectivo", "Cheque", "E-Cheq", "Retenciones", "Transferencia", "Canje", "Saldo a favor"],
    },
    monto: { type: Number },
    numeroCheque: { type: String, default: "" },
    fechaCobro: { type: String, default: "" },
    estado: {
      type: String,
      enum: ["En cartera", "Utilizado", "Depositado", "Pago proveedores", "Depósito en banco", "Cambio", "Otros"],
      default: "En cartera",
    },
    proveedor: { type: String, default: "" },
    tasaInteres: { type: Number, default: null },
    gastosPorc: { type: Number, default: null },
    montoDescontado: { type: Number, default: null },
    fechaCambio: { type: String, default: "" },
    observaciones: { type: String, default: "" },
  },
  { _id: false }
);

const pagoSchema = new mongoose.Schema(
  {
    factura: { type: mongoose.Schema.Types.ObjectId, ref: "Factura", required: true },
    montoCobrado: { type: Number, required: true },
    medioPago: {
      type: String,
      enum: ["Efectivo", "Cheque", "E-Cheq", "Retenciones", "Transferencia", "Canje"],
    },
    observaciones: { type: String, default: "" },
  },
  { _id: false }
);

const cobroSchema = new mongoose.Schema(
  {
    fecha: { type: String, required: true },
    cliente: { type: String, required: true },
    medioPago: { type: String },
    mediosPago: [medioPagoSchema],
    pagos: [pagoSchema],
    // "proveedor": devolución de un proveedor al que se le pagó de más. Va
    // acá para que sus cheques entren en cartera; `cliente` guarda el nombre
    // del proveedor y nunca tiene facturas imputadas. Queda fuera de cobros,
    // cuenta corriente y saldo a favor de clientes (ver PROVEEDOR_FUERA).
    origen: { type: String, enum: ["cliente", "proveedor"], default: "cliente" },
    observaciones: { type: String, default: "" },
  },
  { timestamps: true }
);

cobroSchema.index({ cliente: 1 });
cobroSchema.index({ "pagos.factura": 1 });
cobroSchema.index({ createdAt: -1 });

export default mongoose.model("Cobro", cobroSchema);

// Filtro para dejar afuera las devoluciones de proveedores en todo lo de clientes.
export const PROVEEDOR_FUERA = { origen: { $ne: "proveedor" } };
