import ConsumoGasoil from "../models/consumoGasoil.js";

export const obtenerConsumoGasoil = async (req, res) => {
  try {
    let doc = await ConsumoGasoil.findOne();
    if (!doc) {
      doc = new ConsumoGasoil({ consumos: [], porcentajeIndirectos: 0 });
      await doc.save();
    }
    res.status(200).json(doc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener consumos gasoil" });
  }
};

export const guardarConsumoGasoil = async (req, res) => {
  try {
    const { consumos, porcentajeIndirectos } = req.body;
    let doc = await ConsumoGasoil.findOne();
    if (doc) {
      doc.consumos = consumos;
      doc.porcentajeIndirectos = porcentajeIndirectos;
      await doc.save();
    } else {
      doc = new ConsumoGasoil({ consumos, porcentajeIndirectos });
      await doc.save();
    }
    res.status(200).json(doc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al guardar consumos gasoil" });
  }
};
