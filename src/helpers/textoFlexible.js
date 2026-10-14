// Comparación de nombres (clientes, obras, proveedores, etc.) sin distinguir
// mayúsculas, acentos ni espacios de más: "Nougues ", "nougues" y "NOUGUÉS"
// son el mismo.

const sinAcentos = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

export const normTexto = (s) =>
  sinAcentos((s ?? "").toString()).replace(/\s+/g, " ").trim().toLowerCase();

export const mismoTexto = (a, b) => normTexto(a) === normTexto(b);

const VARIANTES = { a: "aáàäâ", e: "eéèëê", i: "iíìïî", o: "oóòöô", u: "uúùüû", n: "nñ" };

// RegExp para un filtro de Mongo que matchea el valor completo con el mismo
// criterio que normTexto. Ej.: { cliente: regexTexto("nougues") }.
export const regexTexto = (s) => {
  const patron = [...normTexto(s)]
    .map((c) => {
      if (c === " ") return "\\s+";
      if (VARIANTES[c]) return `[${VARIANTES[c]}]`;
      return c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("");
  return new RegExp(`^\\s*${patron}\\s*$`, "i");
};
