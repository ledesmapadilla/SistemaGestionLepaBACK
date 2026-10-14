import mongoose from "mongoose";

// Todo String de todos los modelos se guarda sin espacios al principio ni al
// final. Hubo clientes guardados como "Nougues " que después no coincidían con
// "Nougues" en otras colecciones (cargas de gasoil, cobros, facturas).
// Tiene que importarse antes que cualquier modelo: la opción se aplica al
// crear cada schema. Un campo puede desactivarlo con `trim: false`.
mongoose.Schema.Types.String.set("trim", true);
