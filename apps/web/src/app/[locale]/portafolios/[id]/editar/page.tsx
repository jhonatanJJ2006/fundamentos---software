import { verPortafolio } from "@/controllers/PortafolioController";
import { resolverIdioma } from "@/lib/idioma";
import { FormPortafolio } from "@/views/components/FormPortafolio";
import { Migas, TituloPagina } from "@/views/components/ui";

/** Vista RF03 — Modificar portafolio. */
export default async function EditarPortafolio({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { idioma, t } = await resolverIdioma(params);
  const { id } = await params;
  const portafolio = await verPortafolio(id);
  return (
    <div className="mx-auto max-w-2xl">
      <Migas
        etiqueta={t("comun.migas")}
        items={[
          { texto: t("portafolio.lista.titulo"), href: `/${idioma}/portafolios` },
          { texto: portafolio.nombre, href: `/${idioma}/portafolios/${id}` },
          { texto: t("comun.editar") },
        ]}
      />
      <TituloPagina titulo={t("portafolio.editar")} subtitulo={portafolio.nombre} />
      <FormPortafolio idioma={idioma} portafolio={portafolio} />
    </div>
  );
}
