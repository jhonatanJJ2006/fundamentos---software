import es from "./locales/es.json";
import en from "./locales/en.json";

/** Idiomas soportados por la interfaz (RNF01). */
export const IDIOMAS = ["es", "en"] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const IDIOMA_POR_DEFECTO: Idioma = "es";

export type Diccionario = typeof es;
const diccionarios: Record<Idioma, Diccionario> = { es, en };

export function esIdioma(valor: unknown): valor is Idioma {
  return typeof valor === "string" && (IDIOMAS as readonly string[]).includes(valor);
}

function buscar(dic: unknown, clave: string): string | undefined {
  const valor = clave.split(".").reduce<unknown>((nodo, parte) => {
    if (nodo && typeof nodo === "object") return (nodo as Record<string, unknown>)[parte];
    return undefined;
  }, dic);
  return typeof valor === "string" ? valor : undefined;
}

export type Parametros = Record<string, string | number>;

/** Traduce una clave ("portafolio.titulo") al idioma indicado, reemplazando {parametros}. */
export function traducir(idioma: Idioma, clave: string, params?: Parametros): string {
  const texto = buscar(diccionarios[idioma], clave) ?? buscar(diccionarios[IDIOMA_POR_DEFECTO], clave) ?? clave;
  if (!params) return texto;
  return texto.replace(/\{(\w+)\}/g, (_, nombre: string) => String(params[nombre] ?? `{${nombre}}`));
}

/** Devuelve una función t() ligada a un idioma, para usar en las vistas. */
export function crearTraductor(idioma: Idioma) {
  return (clave: string, params?: Parametros) => traducir(idioma, clave, params);
}
export type Traductor = ReturnType<typeof crearTraductor>;

/** Lista todas las claves hoja de un diccionario (usado en pruebas de cobertura de traducción). */
export function clavesDe(dic: unknown, prefijo = ""): string[] {
  if (!dic || typeof dic !== "object") return [prefijo];
  return Object.entries(dic as Record<string, unknown>).flatMap(([k, v]) =>
    clavesDe(v, prefijo ? `${prefijo}.${k}` : k),
  );
}

export { es, en };
