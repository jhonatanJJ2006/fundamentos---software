import { verFormulario } from "@/controllers/FormularioController";
import { resolverIdioma } from "@/lib/idioma";
import { FormPregunta } from "@/views/components/FormPregunta";
import { Alerta, EnlaceBoton, Migas, TituloPagina } from "@/views/components/ui";

/** Vista RF10 — Agregar pregunta. */
export default async function NuevaPregunta({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { idioma, t } = await resolverIdioma(params);
  const { id } = await params;
  const formulario = await verFormulario(id);
  return (
    <div className="mx-auto max-w-3xl">
      <Migas
        etiqueta={t("comun.migas")}
        items={[
          { texto: t("portafolio.lista.titulo"), href: `/${idioma}/portafolios` },
          { texto: formulario.titulo, href: `/${idioma}/formularios/${id}` },
          { texto: t("pregunta.nueva") },
        ]}
      />
      <TituloPagina titulo={t("pregunta.nueva")} subtitulo={formulario.titulo} />
      {formulario.esEditable ? (
        <FormPregunta idioma={idioma} formularioId={id} totalPreguntas={formulario.preguntas.length} />
      ) : (
        <div className="space-y-4">
          <Alerta tipo="error">{t("errores.formulario.estructuraBloqueada")}</Alerta>
          <EnlaceBoton variante="secundario" href={`/${idioma}/formularios/${id}`}>{t("comun.volver")}</EnlaceBoton>
        </div>
      )}
    </div>
  );
}
