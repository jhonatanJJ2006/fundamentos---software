import { EstadoFormulario, TipoPregunta } from "@ciudadania/model/enums";
import { cambiarEstadoFormulario, eliminarFormulario, verFormulario } from "@/controllers/FormularioController";
import { verPortafolio } from "@/controllers/PortafolioController";
import { eliminarPregunta } from "@/controllers/PreguntaController";
import { formatearFecha, resolverIdioma } from "@/lib/idioma";
import { BotonConfirmar } from "@/views/components/BotonConfirmar";
import { MensajeExito } from "@/views/components/MensajeExito";
import { Alerta, EnlaceBoton, EtiquetaEstado, Migas, Tarjeta, TituloPagina, Vacio } from "@/views/components/ui";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ ok?: string }>;
};

/** Vista RF06 — Detalle del formulario con sus preguntas en orden; acciones RF07–RF12. */
export default async function DetalleFormulario({ params, searchParams }: Props) {
  const { idioma, t } = await resolverIdioma(params);
  const { id } = await params;
  const { ok } = await searchParams;
  const formulario = await verFormulario(id);
  const portafolio = await verPortafolio(formulario.portafolioId);
  const base = `/${idioma}/formularios/${id}`;

  const accionEliminar = formulario.totalReportes > 0
    ? { titulo: t("formulario.eliminar.tituloCerrar"), mensaje: t("formulario.eliminar.mensajeConReportes", { total: formulario.totalReportes }), confirmar: t("formulario.eliminar.confirmarCerrar") }
    : { titulo: t("formulario.eliminar.titulo"), mensaje: t("formulario.eliminar.mensaje", { titulo: formulario.titulo }), confirmar: t("comun.siEliminar") };

  return (
    <>
      <Migas
        etiqueta={t("comun.migas")}
        items={[
          { texto: t("portafolio.lista.titulo"), href: `/${idioma}/portafolios` },
          { texto: portafolio.nombre, href: `/${idioma}/portafolios/${portafolio.id}` },
          { texto: formulario.titulo },
        ]}
      />
      <MensajeExito ok={ok} t={t} />

      <Tarjeta className="mb-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primario">{t("formulario.etiqueta")}</p>
              <EtiquetaEstado estado={formulario.estado} t={t} />
            </div>
            <h1 className="mt-1 text-2xl font-bold text-tinta break-words sm:text-3xl">{formulario.titulo}</h1>
            <p className="mt-2 text-tenue break-words">{formulario.descripcion}</p>
            <p className="mt-3 text-xs text-tenue">
              {t("formulario.campos.fechaCreacion")}: {formatearFecha(formulario.fechaCreacion, idioma)} ·{" "}
              {t("formulario.totalReportes", { total: formulario.totalReportes })}
            </p>
            <details className="mt-4 rounded-lg bg-fondo p-3 ring-1 ring-borde">
              <summary className="cursor-pointer text-sm font-semibold text-tinta">{t("formulario.campos.consentimiento")}</summary>
              <p className="mt-2 whitespace-pre-line text-sm text-tenue break-words">{formulario.consentimiento}</p>
            </details>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:max-w-xs lg:flex-col">
            {formulario.estado === EstadoFormulario.BORRADOR && (
              <BotonConfirmar
                idioma={idioma}
                accion={cambiarEstadoFormulario}
                campos={{ id, estado: EstadoFormulario.PUBLICADO }}
                variante="primario"
                textoBoton={t("formulario.estado.publicar")}
                tituloDialogo={t("formulario.estado.publicarTitulo")}
                mensajeDialogo={t("formulario.estado.publicarMensaje")}
                textoConfirmar={t("formulario.estado.publicar")}
              />
            )}
            {formulario.estado === EstadoFormulario.PUBLICADO && (
              <BotonConfirmar
                idioma={idioma}
                accion={cambiarEstadoFormulario}
                campos={{ id, estado: EstadoFormulario.CERRADO }}
                variante="secundario"
                textoBoton={t("formulario.estado.cerrar")}
                tituloDialogo={t("formulario.estado.cerrarTitulo")}
                mensajeDialogo={t("formulario.estado.cerrarMensaje")}
                textoConfirmar={t("formulario.estado.cerrar")}
              />
            )}
            <EnlaceBoton variante="secundario" href={`${base}/editar`}>{t("formulario.editarDatos")}</EnlaceBoton>
            {formulario.estado !== EstadoFormulario.CERRADO && (
              <BotonConfirmar
                idioma={idioma}
                accion={eliminarFormulario}
                campos={{ id, portafolioId: formulario.portafolioId }}
                textoBoton={t("comun.eliminar")}
                tituloDialogo={accionEliminar.titulo}
                mensajeDialogo={accionEliminar.mensaje}
                textoConfirmar={accionEliminar.confirmar}
              />
            )}
          </div>
        </div>
      </Tarjeta>

      <TituloPagina
        titulo={t("pregunta.lista.titulo", { total: formulario.preguntas.length })}
        acciones={formulario.esEditable && <EnlaceBoton href={`${base}/preguntas/nueva`}>+ {t("pregunta.nueva")}</EnlaceBoton>}
      />

      {!formulario.esEditable && (
        <div className="mb-4">
          <Alerta tipo="info">{t("formulario.estructuraBloqueadaInfo", { estado: t(`estados.${formulario.estado}`) })}</Alerta>
        </div>
      )}

      {formulario.preguntas.length === 0 ? (
        <Vacio
          titulo={t("pregunta.lista.vacio")}
          texto={t("pregunta.lista.vacioAyuda")}
          accion={formulario.esEditable && <EnlaceBoton href={`${base}/preguntas/nueva`}>+ {t("pregunta.nueva")}</EnlaceBoton>}
        />
      ) : (
        <ol className="space-y-3">
          {formulario.preguntas.map((p) => (
            <li key={p.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-borde">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primario/10 text-sm font-bold text-primario">
                    {p.orden}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-tinta break-words">
                      {p.enunciado}
                      {p.obligatoria && <span className="ml-1 text-peligro" title={t("pregunta.campos.obligatoria")}>*</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-tenue">
                      {t(`tipos.${p.tipo}`)} · {p.obligatoria ? t("pregunta.obligatoria") : t("pregunta.opcional")}
                    </p>
                    {p.tipo === TipoPregunta.OPCION_MULTIPLE && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {p.opciones.map((o) => (
                          <li key={o} className="rounded-md bg-fondo px-2 py-0.5 text-xs text-tinta ring-1 ring-borde break-all">{o}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {formulario.esEditable && (
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <EnlaceBoton variante="secundario" href={`${base}/preguntas/${p.id}/editar`}>{t("comun.editar")}</EnlaceBoton>
                    <BotonConfirmar
                      idioma={idioma}
                      accion={eliminarPregunta}
                      campos={{ id: p.id, formularioId: id }}
                      textoBoton={t("comun.eliminar")}
                      tituloDialogo={t("pregunta.eliminar.titulo")}
                      mensajeDialogo={t("pregunta.eliminar.mensaje", { orden: p.orden })}
                      textoConfirmar={t("comun.siEliminar")}
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
