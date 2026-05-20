import mongoose from "mongoose";
import "colors";

mongoose.connect(process.env.MONGODB, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000, // mantiene conexiones idle activas
  family: 4,
})
  .then(() => {
    console.info(`Base de datos ${mongoose.connection.name.green} conectada exitosamente`);
  })
  .catch((error) => {
    console.error("Error al conectar a la base de datos:", error.message);
  });

export default mongoose;