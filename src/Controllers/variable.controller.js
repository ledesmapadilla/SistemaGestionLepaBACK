import Variable from "../models/variable.js";

// CREATE
export const crearVariable = async (req, res) => {
  try {
    const nuevaVariable = new Variable(req.body);
    await nuevaVariable.save();

    res.status(201).json({
      msg: "Variable creada correctamente",
      variable: nuevaVariable,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al crear variable" });
  }
};

// READ - obtener todas
export const obtenerVariables = async (req, res) => {
  try {
    const variables = await Variable.find();
    res.status(200).json(variables);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener variables" });
  }
};

// UPDATE
export const editarVariable = async (req, res) => {
  try {
    const variableActualizada = await Variable.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      msg: "Variable actualizada",
      variable: variableActualizada,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al editar variable" });
  }
};

// DELETE
export const eliminarVariable = async (req, res) => {
  try {
    await Variable.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Variable eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar variable" });
  }
};
