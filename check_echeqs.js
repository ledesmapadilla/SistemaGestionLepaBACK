import mongoose from "mongoose";
import Cobro from "./src/models/cobro.js";

async function run() {
  const uri = process.env.MONGODB;
  if (!uri) {
    console.error("MONGODB URI not found in env!");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const cobros = await Cobro.find({});
  console.log("Total cobros:", cobros.length);
  
  const allMedios = [];
  cobros.forEach(c => {
    if (c.mediosPago && c.mediosPago.length > 0) {
      c.mediosPago.forEach(m => {
        if (m.medioPago === "Cheque" || m.medioPago === "E-Cheq") {
          allMedios.push({
            cliente: c.cliente,
            medioPago: m.medioPago,
            numeroCheque: m.numeroCheque,
            monto: m.monto,
            estado: m.estado
          });
        }
      });
    }
  });

  console.log("Cheques and E-Cheqs found:");
  console.log(JSON.stringify(allMedios, null, 2));
  
  await mongoose.disconnect();
}

run().catch(console.error);
