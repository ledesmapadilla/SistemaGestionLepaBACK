import Aceite from "../models/aceite.js";

export const listarAceites = async (req, res) => {
  try {
    const aceites = await Aceite.find();
    res.status(200).json(aceites);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al listar aceites" });
  }
};

export const crearAceite = async (req, res) => {
  try {
    const { tipo, marca, denominacion, uso } = req.body;
    const nuevoAceite = new Aceite({ tipo, marca, denominacion, uso });
    await nuevoAceite.save();
    res.status(201).json({ msg: "Aceite creado correctamente", aceite: nuevoAceite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear el aceite" });
  }
};

export const registrarCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, proveedor, marca, cantidad, precio, observaciones } = req.body;

    const aceite = await Aceite.findById(id);
    if (!aceite) return res.status(404).json({ msg: "Aceite no encontrado" });

    aceite.movimientos.push({
      tipoMov: "INGRESO",
      fecha,
      proveedor,
      marca,
      litros: Number(cantidad),
      precio: Number(precio),
      observaciones,
    });
    await aceite.save();

    res.status(200).json({ msg: "Compra registrada correctamente", aceite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al registrar la compra" });
  }
};

export const registrarConsumo = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, litros, maquina, obra, observaciones } = req.body;

    const aceite = await Aceite.findById(id);
    if (!aceite) return res.status(404).json({ msg: "Aceite no encontrado" });

    aceite.movimientos.push({
      tipoMov: "SALIDA",
      fecha,
      litros: Number(litros),
      maquina,
      obra,
      observaciones,
    });
    await aceite.save();

    res.status(200).json({ msg: "Consumo registrado correctamente", aceite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al registrar el consumo" });
  }
};

export const editarAceite = async (req, res) => {
  try {
    const { id } = req.params;
    const aceiteEditado = await Aceite.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ msg: "Aceite actualizado", aceite: aceiteEditado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar" });
  }
};

export const borrarAceite = async (req, res) => {
  try {
    await Aceite.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Aceite eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al borrar" });
  }
};

export const editarMovimiento = async (req, res) => {
  try {
    const { id, movId } = req.params;
    const { fecha, proveedor, marca, cantidad, precio, maquina, obra, observaciones } = req.body;

    const aceite = await Aceite.findById(id);
    if (!aceite) return res.status(404).json({ msg: "Aceite no encontrado" });

    const mov = aceite.movimientos.id(movId);
    if (!mov) return res.status(404).json({ msg: "Movimiento no encontrado" });

    if (fecha) mov.fecha = fecha;
    if (proveedor !== undefined) mov.proveedor = proveedor;
    if (marca !== undefined) mov.marca = marca;
    if (cantidad !== undefined) mov.litros = Number(cantidad);
    if (precio !== undefined) mov.precio = Number(precio);
    if (maquina !== undefined) mov.maquina = maquina;
    if (obra !== undefined) mov.obra = obra;
    if (observaciones !== undefined) mov.observaciones = observaciones;

    await aceite.save();
    res.status(200).json({ msg: "Movimiento actualizado", aceite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar movimiento" });
  }
};

export const borrarMovimiento = async (req, res) => {
  try {
    const { id, movId } = req.params;

    const aceite = await Aceite.findById(id);
    if (!aceite) return res.status(404).json({ msg: "Aceite no encontrado" });

    aceite.movimientos.pull({ _id: movId });
    await aceite.save();

    res.status(200).json({ msg: "Movimiento eliminado", aceite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al borrar movimiento" });
  }
};
