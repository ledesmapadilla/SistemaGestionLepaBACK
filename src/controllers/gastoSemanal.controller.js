import GastoSemanal from "../models/gastoSemanal.js";

export const obtenerGastoSemanal = async (req, res) => {
  try {
    const { semana } = req.query;
    if (semana) {
      const doc = await GastoSemanal.findOne({ semana });
      return res.status(200).json(doc || null);
    }
    const docs = await GastoSemanal.find().sort({ semana: -1 });
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener gastos semanales", detalle: error.message });
  }
};

export const guardarGastoSemanal = async (req, res) => {
  try {
    const { semana, registros } = req.body;
    let doc = await GastoSemanal.findOne({ semana });
    if (doc) {
      doc.registros = registros;
      doc.markModified("registros");
      await doc.save();
    } else {
      doc = new GastoSemanal({ semana, registros });
      await doc.save();
    }
    res.status(200).json({ msg: "Gasto semanal guardado", data: doc });
  } catch (error) {
    res.status(500).json({ msg: "Error al guardar gasto semanal", detalle: error.message });
  }
};
