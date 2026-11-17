import { notFound } from "next/navigation";
import { crearTraductor, esIdioma, type Idioma } from "@ciudadania/i18n";

/** Lee y valida el idioma del segmento /[locale] de la URL. */
export async function resolverIdioma(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  if (!esIdioma(locale)) notFound();
  const idioma: Idioma = locale;
  return { idioma, t: crearTraductor(idioma) };
}

export function formatearFecha(iso: string, idioma: Idioma) {
  return new Intl.DateTimeFormat(idioma === "es" ? "es-EC" : "en-US", { dateStyle: "medium" }).format(new Date(iso));
}
