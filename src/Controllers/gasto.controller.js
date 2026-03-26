import Gasto from "../models/gasto.js";


// CREATE (Este queda igual, ahora guardará obra y remito gracias al cambio en el modelo)
export const crearGasto = async (req, res) => {
  console.log("BODY QUE LLEGA:", req.body);
  try {
    const nuevoGasto = new Gasto(req.body);
    await nuevoGasto.save();
    res.status(201).json({ msg: "Gasto creado", gasto: nuevoGasto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear gasto", detalle: error.message });
  }
};

// READ - AHORA CON FILTRO POR OBRA
export const obtenerGastos = async (req, res) => {
  try {
    // Extraemos obra del query params también
    const { item, unidad, obra } = req.query; 

    let filtros = {};

    // IMPORTANTE: Si mandas el ID de la obra, filtramos por eso.
    if (obra) {
      filtros.obra = obra;
    }

    if (item) {
      filtros.item = { $regex: item, $options: "i" };
    }

    if (unidad) {
      filtros.unidad = { $regex: unidad, $options: "i" };
    }

    const gastos = await Gasto.find(filtros).sort({ createdAt: -1 }); // Ordenar por más nuevo

    res.status(200).json(gastos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener gastos" });
  }
};

// UPDATE y DELETE quedan igual...

// UPDATE
export const editarGasto = async (req, res) => {
  try {
    const gastoActualizado = await Gasto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!gastoActualizado) {
      return res.status(404).json({ msg: "Gasto no encontrado" });
    }

    res.status(200).json({
      msg: "Gasto actualizado",
      gasto: gastoActualizado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar gasto" });
  }
};

// DELETE
export const eliminarGasto = async (req, res) => {
  try {
    const gastoEliminado = await Gasto.findByIdAndDelete(req.params.id);

    if (!gastoEliminado) {
      return res.status(404).json({ msg: "Gasto no encontrado" });
    }

    res.status(200).json({ msg: "Gasto eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar gasto" });
  }
};
