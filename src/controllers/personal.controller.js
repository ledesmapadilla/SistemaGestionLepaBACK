import Personal from "../models/personal.js";

export const crearPersonal = async (req, res) => {
  try {
    const nuevoPersonal = new Personal(req.body);
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
    const personalActualizado = await Personal.findByIdAndUpdate(
      req.params.id,
      req.body,
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
