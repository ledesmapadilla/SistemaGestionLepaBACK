import Obra from "../models/obra.js";
import Maquina from "../models/maquina.js";
import Personal from "../models/personal.js";

// Los únicos que cargan gasoil, igual que en el modal del front.
const QUIENES_CARGAN = ["Nacho", "Agustín", "Castillo, Nelson", "Ruiz, Mauricio"];

// Endpoint sin token: lo consume la página /gasoil/carga desde el celular, que
// no loguea. Por eso devuelve SOLO los nombres que necesitan los selects, con
// proyección explícita: nada de precios de obra, sueldos, CUIT ni contactos.
export const obtenerOpcionesGasoil = async (req, res) => {
  try {
    const [obras, maquinas, personal] = await Promise.all([
      Obra.find({ estado: "En curso" }, "razonsocial nombreobra estado").lean(),
      Maquina.find({ usaGasoil: { $ne: false } }, "maquina").lean(),
      Personal.find({ nombre: { $in: QUIENES_CARGAN } }, "nombre").lean(),
    ]);

    // Sin _id: al front le alcanza con el texto y así no se filtran ids de la base.
    res.status(200).json({
      obras: obras.map((o) => ({
        razonsocial: o.razonsocial,
        nombreobra: o.nombreobra,
        estado: o.estado,
      })),
      maquinas: maquinas.map((m) => ({ maquina: m.maquina })),
      personal: personal.map((p) => ({ nombre: p.nombre })),
    });
  } catch (error) {
    console.error("Error al obtener opciones públicas de gasoil:", error);
    res
      .status(500)
      .json({ msg: "Error al obtener las opciones de gasoil", detalle: error.message });
  }
};
