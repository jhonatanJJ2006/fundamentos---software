import { notFound } from "next/navigation";
import { verFormulario } from "@/controllers/FormularioController";
import { resolverIdioma } from "@/lib/idioma";
import { FormPregunta } from "@/views/components/FormPregunta";
import { Alerta, EnlaceBoton, Migas, TituloPagina } from "@/views/components/ui";

/** Vista RF11 — Modificar pregunta (solo en formularios en Borrador). */
export default async function EditarPregunta({ params }: { params: Promise<{ locale: string; id: string; preguntaId: string }> }) {
  const { idioma, t } = await resolverIdioma(params);
  const { id, preguntaId } = await params;
  const formulario = await verFormulario(id);
  const pregunta = formulario.preguntas.find((p) => p.id === preguntaId);
  if (!pregunta) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Migas
        etiqueta={t("comun.migas")}
        items={[
          { texto: t("portafolio.lista.titulo"), href: `/${idioma}/portafolios` },
          { texto: formulario.titulo, href: `/${idioma}/formularios/${id}` },
          { texto: t("pregunta.editar") },
        ]}
      />
      <TituloPagina titulo={t("pregunta.editar")} subtitulo={t("pregunta.numero", { orden: pregunta.orden })} />
      {formulario.esEditable ? (
        <FormPregunta idioma={idioma} formularioId={id} totalPreguntas={formulario.preguntas.length} pregunta={pregunta} />
      ) : (
        <div className="space-y-4">
          <Alerta tipo="error">{t("errores.formulario.estructuraBloqueada")}</Alerta>
          <EnlaceBoton variante="secundario" href={`/${idioma}/formularios/${id}`}>{t("comun.volver")}</EnlaceBoton>
        </div>
      )}
    </div>
  );
}
