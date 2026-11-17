import { verFormulario } from "@/controllers/FormularioController";
import { verPortafolio } from "@/controllers/PortafolioController";
import { resolverIdioma } from "@/lib/idioma";
import { FormFormulario } from "@/views/components/FormFormulario";
import { Migas, TituloPagina } from "@/views/components/ui";

/** Vista RF07 — Modificar título, descripción y consentimiento. */
export default async function EditarFormulario({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { idioma, t } = await resolverIdioma(params);
  const { id } = await params;
  const formulario = await verFormulario(id);
  const portafolio = await verPortafolio(formulario.portafolioId);
  return (
    <div className="mx-auto max-w-3xl">
      <Migas
        etiqueta={t("comun.migas")}
        items={[
          { texto: t("portafolio.lista.titulo"), href: `/${idioma}/portafolios` },
          { texto: portafolio.nombre, href: `/${idioma}/portafolios/${portafolio.id}` },
          { texto: formulario.titulo, href: `/${idioma}/formularios/${id}` },
          { texto: t("comun.editar") },
        ]}
      />
      <TituloPagina titulo={t("formulario.editar")} subtitulo={formulario.titulo} />
      <FormFormulario idioma={idioma} portafolioId={formulario.portafolioId} formulario={formulario} />
    </div>
  );
}
