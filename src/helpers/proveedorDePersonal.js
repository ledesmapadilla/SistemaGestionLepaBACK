import Proveedor from "../models/proveedor.js";
import { normTexto } from "./textoFlexible.js";

// Mismo nombre sin importar el orden de las palabras ni la puntuación: el
// legajo usa "Apellido, Nombre" y los proveedores suelen estar como
// "Nombre Apellido" ("Diaz, Ivan" = "Ivan Diaz").
const clavePersona = (s) =>
  normTexto(String(s ?? "").replace(/[.,;]/g, " ")).split(" ").filter(Boolean).sort().join(" ");

export const esMismaPersona = (a, b) => clavePersona(a) === clavePersona(b);

// Cada persona del legajo también es proveedor (rubro "Personal"), con su
// nombre como razón social y contacto. Sin teléfono: se completa a mano.
// Si ya existe un proveedor con ese nombre (aunque esté escrito distinto) no
// se duplica. Devuelve true si lo creó.
export const asegurarProveedorDePersonal = async (nombre) => {
  const razonsocial = String(nombre || "").trim();
  if (!razonsocial) return false;
  const todos = await Proveedor.find({}, { razonsocial: 1 }).lean();
  if (todos.some((p) => esMismaPersona(p.razonsocial, razonsocial))) return false;
  await Proveedor.create({ razonsocial, contacto: razonsocial, rubro: "Personal" });
  return true;
};
