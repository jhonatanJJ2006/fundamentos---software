import { resolverIdioma } from "@/lib/idioma";
import { FormPortafolio } from "@/views/components/FormPortafolio";
import { Migas, TituloPagina } from "@/views/components/ui";

/** Vista RF01 — Registrar portafolio. */
export default async function NuevoPortafolio({ params }: { params: Promise<{ locale: string }> }) {
  const { idioma, t } = await resolverIdioma(params);
  return (
    <div className="mx-auto max-w-2xl">
      <Migas etiqueta={t("comun.migas")} items={[{ texto: t("portafolio.lista.titulo"), href: `/${idioma}/portafolios` }, { texto: t("portafolio.nuevo") }]} />
      <TituloPagina titulo={t("portafolio.nuevo")} subtitulo={t("portafolio.nuevoAyuda")} />
      <FormPortafolio idioma={idioma} />
    </div>
  );
}
