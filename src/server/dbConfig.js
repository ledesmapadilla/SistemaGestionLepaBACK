import mongoose from "mongoose";
import "colors";

mongoose.connect(process.env.MONGODB)
  .then(() => {
    console.info(`Base de datos ${mongoose.connection.name.green} conectada exitosamente`);
  })
  .catch((error) => {
    console.error("Error al conectar a la base de datos:", error.message);
  });

export default mongoose;