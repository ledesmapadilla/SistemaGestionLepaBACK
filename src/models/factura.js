import mongoose from "mongoose";

const facturaSchema = new mongoose.Schema(
  {
    fecha: { type: String, required: true },
    tipoFactura: {
      type: String,
      required: true,
      enum: ["Factura A", "Factura X", "Nota de Crédito", "Nota de Débito"],
    },
    numeroFactura: { type: String, required: true },
    cliente: { type: String, required: true },
    remitos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Remito" }],
    total: { type: Number, default: 0 },
    estadoPago: {
      type: String,
      enum: ["Pendiente", "Pagada"],
      default: "Pendiente",
    },
    facturaAsociada: { type: String, default: "" },
    montosPorRemito: [
      {
        remitoId: { type: mongoose.Schema.Types.ObjectId, ref: "Remito" },
        monto: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

facturaSchema.index({ cliente: 1 });
facturaSchema.index({ estadoPago: 1 });
facturaSchema.index({ createdAt: -1 });

export default mongoose.model("Factura", facturaSchema);
