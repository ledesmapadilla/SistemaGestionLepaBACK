import mongoose from "mongoose";

const uri = "mongodb://127.0.0.1:27017/sgl_db" || process.env.MONGO_URI;

async function run() {
  await mongoose.connect(uri);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));
  
  // Try to find pending tasks collection
  const Pendiente = mongoose.model("Pendiente", new mongoose.Schema({}, { strict: false }), "pendientes");
  const docs = await Pendiente.find({}).lean();
  console.log("Pendiente documents:", docs.map(d => ({ _id: d._id, responsable: d.responsable, tareasCount: d.tareas?.length })));
  
  await mongoose.disconnect();
}

run().catch(console.error);
