// SOLO LECTURA. Diagnostico de la obra de precio cerrado que no trae precio.
import mongoose from "mongoose";
import Obra from "../src/models/obra.js";
import Remito from "../src/models/remito.js";

const run = async () => {
  await mongoose.connect(process.env.MONGODB);

  const obras = await Obra.find({ nombreobra: /maipu/i }).lean();
  console.log(`\n=== OBRAS que matchean /maipu/i: ${obras.length} ===`);

  for (const o of obras) {
    console.log(`\n--- ${o.nombreobra} | cliente: ${o.razonsocial} ---`);
    console.log(`_id: ${o._id}`);
    console.log(`modalidad: ${JSON.stringify(o.modalidad)}`);
    console.log(`estado: ${o.estado}`);
    console.log(`precios (${(o.precio || []).length}):`);
    (o.precio || []).forEach((p, i) => {
      console.log(
        `  [${i}] clasificacion=${JSON.stringify(p.clasificacion)} trabajo=${JSON.stringify(p.trabajo)} precio=${p.precio} unidad=${JSON.stringify(p.unidad)} fecha=${p.fecha}`
      );
    });

    const remitos = await Remito.find({ obra: o._id }).lean();
    console.log(`remitos (${remitos.length}):`);
    for (const r of remitos) {
      const total = (r.items || []).reduce(
        (s, i) => s + Number(i.cantidad) * Number(i.precioUnitario),
        0
      );
      console.log(
        `  remito #${r.numeroRemito} estado=${JSON.stringify(r.estado)} montoFacturado=${r.montoFacturado} total=${total}`
      );
      (r.items || []).forEach((i, ix) => {
        console.log(
          `    item[${ix}] servicio=${JSON.stringify(i.servicio)} maquina=${JSON.stringify(i.maquina)} cantidad=${i.cantidad} precioUnitario=${i.precioUnitario} fecha=${i.fecha}`
        );
      });
    }
  }

  await mongoose.disconnect();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
