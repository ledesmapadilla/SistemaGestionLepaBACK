import Dato931 from "../models/dato931.js";

export const obtenerDatos931 = async (req, res) => {
  try {
    const { anio, mes } = req.query;
    const filtro = { anio: Number(anio) };
    if (mes !== undefined) filtro.mes = Number(mes);
    const datos = await Dato931.find(filtro);
    res.status(200).json(datos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener datos 931" });
  }
};

export const guardarDato931 = async (req, res) => {
  try {
    const { anio, mes, tipo, valor } = req.body;
    const dato = await Dato931.findOneAndUpdate(
      { anio, mes, tipo },
      { valor },
      { upsert: true, new: true }
    );
    res.status(200).json({ msg: "Dato guardado", dato });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al guardar dato 931" });
  }
};

export const agregarHistorial931 = async (req, res) => {
  try {
    const { anio, mes, tipo, valor, fecha, observaciones } = req.body;
    const dato = await Dato931.findOneAndUpdate(
      { anio, mes, tipo },
      {
        $push: { historial: { valor, fecha, observaciones: observaciones || "" } },
        $set:  { valor },
      },
      { upsert: true, new: true }
    );
    dato.markModified("historial");
    await dato.save();
    const actualizado = await Dato931.findById(dato._id);
    res.status(200).json({ msg: "Entrada agregada", dato: actualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al agregar al historial" });
  }
};

export const eliminarDato931 = async (req, res) => {
  try {
    await Dato931.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Dato eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar dato 931" });
  }
};
