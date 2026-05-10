import Personal from "../models/personal.js";

export const crearPersonal = async (req, res) => {
  try {
    const hoy = new Date();
    const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
    const nuevoPersonal = new Personal({ ...req.body, fechaAlta: fechaHoy });
    await nuevoPersonal.save();
    res.status(201).json({
      msg: "Personal creado correctamente",
      personal: nuevoPersonal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear personal" });
  }
};

// READ - obtener todos
export const obtenerPersonal = async (req, res) => {
  try {
    const { nombre, semanal } = req.query;

    let filtros = {};

    if (nombre) {
      filtros.nombre = { $regex: nombre, $options: "i" };
    }

   

    if (semanal) {
      filtros["semanal.valor"] = Number(semanal);
    }

    const personal = await Personal.find(filtros);

    res.status(200).json(personal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener personal" });
  }
};


// UPDATE
export const editarPersonal = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.activo === false) {
      const actual = await Personal.findById(req.params.id);
      if (actual && actual.activo !== false && !actual.fechaDesactivado) {
        const hoy = new Date();
        updateData.fechaDesactivado = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
      }
    } else if (updateData.activo === true) {
      updateData.fechaDesactivado = null;
    }

    const personalActualizado = await Personal.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.status(200).json({
      msg: "Personal actualizado",
      personal: personalActualizado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar personal" });
  }
};

// DELETE
export const eliminarPersonal = async (req, res) => {
  try {
    await Personal.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Personal eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar personal" });
  }
};
