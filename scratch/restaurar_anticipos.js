// Deshace la imputación automática: devuelve los pagos de los cobros al backup.
import mongoose from "mongoose";
import fs from "node:fs";
import Cobro from "../src/models/cobro.js";
import Factura from "../src/models/factura.js";
await mongoose.connect(process.env.MONGODB);
const backup = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
for (const b of backup) {
  await Cobro.collection.updateOne({ _id: new mongoose.Types.ObjectId(b._id) }, { $set: { pagos: b.pagos } });
}
const quedan = await Cobro.countDocuments({ "pagos.automatico": true });
// La factura 25 vuelve a Pendiente (lo estaba antes y lo sigue estando).
console.log("restaurados", backup.length, "| pagos automáticos que quedan:", quedan);
await mongoose.disconnect();
