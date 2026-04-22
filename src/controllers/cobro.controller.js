import Cobro from "../models/cobro.js";

export const obtenerCobros = async (req, res) => {
  try {
    const cobros = await Cobro.find()
      .populate("pagos.factura")
      .sort({ createdAt: -1 });
    res.status(200).json(cobros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener cobros" });
  }
};

export const crearCobro = async (req, res) => {
  try {
    const { fecha, cliente, medioPago, mediosPago, pagos } = req.body;
    const nuevoCobro = new Cobro({ fecha, cliente, medioPago, mediosPago, pagos });
    await nuevoCobro.save();
    res.status(201).json({ msg: "Cobro registrado correctamente", cobro: nuevoCobro });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear cobro" });
  }
};

export const editarCobro = async (req, res) => {
  try {
    const cobroActualizado = await Cobro.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!cobroActualizado) return res.status(404).json({ msg: "Cobro no encontrado" });
    res.status(200).json({ msg: "Cobro actualizado", cobro: cobroActualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar cobro" });
  }
};

export const eliminarCobro = async (req, res) => {
  try {
    const cobro = await Cobro.findByIdAndDelete(req.params.id);
    if (!cobro) return res.status(404).json({ msg: "Cobro no encontrado" });
    res.status(200).json({ msg: "Cobro eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar cobro" });
  }
};
