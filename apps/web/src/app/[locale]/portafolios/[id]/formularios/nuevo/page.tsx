import { verPortafolio } from "@/controllers/PortafolioController";
import { resolverIdioma } from "@/lib/idioma";
import { FormFormulario } from "@/views/components/FormFormulario";
import { Migas, TituloPagina } from "@/views/components/ui";

/** Vista RF05 — Registrar formulario dentro de un portafolio. */
export default async function NuevoFormulario({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { idioma, t } = await resolverIdioma(params);
  const { id } = await params;
  const portafolio = await verPortafolio(id);
  return (
    <div className="mx-auto max-w-3xl">
      <Migas
        etiqueta={t("comun.migas")}
        items={[
          { texto: t("portafolio.lista.titulo"), href: `/${idioma}/portafolios` },
          { texto: portafolio.nombre, href: `/${idioma}/portafolios/${id}` },
          { texto: t("formulario.nuevo") },
        ]}
      />
      <TituloPagina titulo={t("formulario.nuevo")} subtitulo={t("formulario.nuevoAyuda")} />
      <FormFormulario idioma={idioma} portafolioId={id} />
    </div>
  );
}
