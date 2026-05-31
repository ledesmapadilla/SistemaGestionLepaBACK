import DatoImpuesto from "../models/datoImpuesto.js";

export const obtenerDatos = async (req, res) => {
  try {
    const { impuesto, anio, mes } = req.query;
    const filtro = { impuesto, anio: Number(anio) };
    if (mes !== undefined) filtro.mes = Number(mes);
    const datos = await DatoImpuesto.find(filtro);
    res.status(200).json(datos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener datos" });
  }
};

export const guardarDato = async (req, res) => {
  try {
    const { impuesto, anio, mes, tipo, valor, observaciones } = req.body;
    const dato = await DatoImpuesto.findOneAndUpdate(
      { impuesto, anio, mes, tipo },
      { valor, observaciones },
      { upsert: true, new: true }
    );
    res.status(200).json({ msg: "Dato guardado", dato });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al guardar dato" });
  }
};

export const agregarHistorial = async (req, res) => {
  try {
    const { impuesto, anio, mes, tipo, valor, fecha, observaciones } = req.body;
    const dato = await DatoImpuesto.findOneAndUpdate(
      { impuesto, anio, mes, tipo },
      {
        $push: { historial: { valor, fecha, observaciones: observaciones || "" } },
        $set:  { valor },
      },
      { upsert: true, new: true }
    );
    dato.markModified("historial");
    await dato.save();
    const actualizado = await DatoImpuesto.findById(dato._id);
    res.status(200).json({ msg: "Entrada agregada", dato: actualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al agregar al historial" });
  }
};

export const eliminarDato = async (req, res) => {
  try {
    await DatoImpuesto.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Dato eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar dato" });
  }
};
