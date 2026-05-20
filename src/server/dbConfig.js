import mongoose from "mongoose";

if (!process.env.MONGODB) {
  console.error("CRITICAL: La variable de entorno MONGODB no está definida.");
} else {
  mongoose.connect(process.env.MONGODB, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 30000,
    heartbeatFrequencyMS: 30000,
    family: 4,
  })
    .then(() => {
      console.info(`Base de datos ${mongoose.connection.name} conectada exitosamente`);
    })
    .catch((error) => {
      console.error("Error al conectar a la base de datos:", error.message);
    });
}

export default mongoose;