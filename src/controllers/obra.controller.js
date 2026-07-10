import Obra from "../models/obra.js";
import Cliente from "../models/cliente.js";
import Remito from "../models/remito.js";

// Busca el precio vigente para una clasificación/trabajo según la fecha de referencia.
// Réplica de la lógica del frontend (RemitosModal.buscarPrecioVigente) para que el
// recálculo retroactivo de remitos sea consistente con cómo se asignan los precios al crearlos.
// Normaliza nombres de trabajo/servicio para comparar sin distinguir
// mayúsculas ni espacios sobrantes (el servicio se escribe a mano).
const normTrabajo = (s) => (s ?? "").toString().trim().toLowerCase();

const buscarPrecioVigente = (precios, clasificacion, trabajo, fechaRef) => {
  const trabajoNorm = normTrabajo(trabajo);
  const candidatos = precios.filter(
    (p) =>
      (clasificacion === "Alquiler"
        ? p.clasificacion?.startsWith("Alquiler")
        : p.clasificacion === clasificacion) &&
      (!trabajo || normTrabajo(p.trabajo) === trabajoNorm)
  );
  if (candidatos.length === 0) return null;
  if (candidatos.length === 1) return candidatos[0];

  const indexados = candidatos.map((p, i) => ({ p, i }));
  const conFecha = indexados.filter(({ p }) => p.fecha);

  if (fechaRef && conFecha.length > 0) {
    const vigentes = conFecha
      .filter(({ p }) => new Date(p.fecha) <= new Date(fechaRef))
      .sort((a, b) => {
        const diff = new Date(b.p.fecha) - new Date(a.p.fecha);
        return diff !== 0 ? diff : b.i - a.i;
      });
    if (vigentes.length > 0) return vigentes[0].p;
    // Si el remito es anterior a todos los precios cargados, usar el más
    // reciente (el precio actual), no el más viejo. Así, al corregir un
    // precio, los remitos viejos también toman el valor nuevo.
    const masReciente = conFecha.sort((a, b) => {
      const diff = new Date(b.p.fecha) - new Date(a.p.fecha);
      return diff !== 0 ? diff : b.i - a.i;
    });
    return masReciente[0].p;
  }

  conFecha.sort((a, b) => {
    const diff = new Date(b.p.fecha) - new Date(a.p.fecha);
    return diff !== 0 ? diff : b.i - a.i;
  });
  return conFecha.length > 0 ? conFecha[0].p : candidatos[candidatos.length - 1];
};

// Mapea un ítem de remito a la clasificación/trabajo de la lista de precios de la obra.
const itemAClasificacionTrabajo = (item) => {
  if (item.servicio === "Precio de la obra")
    return { clasificacion: "Precio cerrado", trabajo: "Precio de la obra" };
  if (item.maquina) return { clasificacion: "Alquiler", trabajo: item.maquina };
  if (item.servicio) return { clasificacion: "Servicio", trabajo: item.servicio };
  return null;
};

// Recalcula el precioUnitario de cada ítem de cada remito de la obra según el precio
// vigente a la fecha del ítem. Devuelve la cantidad de remitos efectivamente modificados.
const recalcularPreciosRemitos = async (obraId, precios) => {
  if (!Array.isArray(precios) || precios.length === 0) return 0;

  const remitos = await Remito.find({ obra: obraId });
  let remitosModificados = 0;

  for (const remito of remitos) {
    // No tocar remitos ya facturados (total o parcial): una factura emitida no
    // debe cambiar sola. Las correcciones de precio sobre lo ya facturado se
    // hacen con Nota de Crédito/Débito.
    if (remito.estado === "Facturado" || (remito.montoFacturado || 0) > 0)
      continue;

    let cambio = false;
    for (const item of remito.items) {
      const mapa = itemAClasificacionTrabajo(item);
      if (!mapa) continue;

      const precioVigente = buscarPrecioVigente(
        precios,
        mapa.clasificacion,
        mapa.trabajo,
        item.fecha
      );
      if (!precioVigente) continue;

      const nuevoPrecio = Number(precioVigente.precio);
      if (!isNaN(nuevoPrecio) && nuevoPrecio !== item.precioUnitario) {
        item.precioUnitario = nuevoPrecio;
        cambio = true;
      }
    }
    if (cambio) {
      remito.markModified("items");
      await remito.save();
      remitosModificados++;
    }
  }

  return remitosModificados;
};

// CREATE (ya la tenés)
export const crearObra = async (req, res) => {
  try {
    const clienteExiste = await Cliente.findOne({
      razonsocial: req.body.razonsocial,
    });

    if (!clienteExiste) {
      return res.status(400).json({
        mensaje: "La razón social no existe",
      });
    }

    const obraNueva = new Obra(req.body);
    await obraNueva.save();

    res.status(201).json(obraNueva);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear obra" });
  }
};

// READ - obtener una por ID
export const obtenerObraPorId = async (req, res) => {
  try {
    const obra = await Obra.findById(req.params.id);
    if (!obra) return res.status(404).json({ msg: "Obra no encontrada" });
    res.status(200).json(obra);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener obra" });
  }
};

// READ - obtener todos
export const obtenerObras = async (req, res) => {
  try {
    const { razonsocial, nombreobra, contacto, estado } = req.query;

    let filtros = {};

    if (razonsocial) {
      filtros.razonsocial = { $regex: razonsocial, $options: "i" };
    }

    if (nombreobra) {
      filtros.nombreobra = { $regex: nombreobra, $options: "i" };
    }

    if (contacto) {
      filtros.contacto = { $regex: contacto, $options: "i" };
    }
    if (estado) {
      filtros.estado = { $regex: estado, $options: "i" };
    }

    const obras = await Obra.find(filtros);
    res.status(200).json(obras);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener obras" });
  }
};

// UPDATE
export const editarObra = async (req, res) => {
  try {
    const { id } = req.params;

    const obraActualizada = await Obra.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!obraActualizada) {
      return res.status(404).json({ message: "Obra no encontrada" });
    }

    // Recalcula los precios de TODOS los remitos de la obra según el precio
    // vigente a la fecha de cada ítem (alquiler, servicio y precio cerrado).
    // Así, al agregar un precio nuevo con fecha X, los remitos con fecha >= X
    // toman el precio nuevo y los anteriores conservan el viejo.
    let remitosActualizados = 0;
    if (req.body.precio) {
      remitosActualizados = await recalcularPreciosRemitos(id, req.body.precio);
    }

    res.json({ ...obraActualizada.toObject(), remitosActualizados });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE
export const eliminarObra = async (req, res) => {
  try {
    await Remito.deleteMany({ obra: req.params.id });
    await Obra.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Obra eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar obra" });
  }
};
