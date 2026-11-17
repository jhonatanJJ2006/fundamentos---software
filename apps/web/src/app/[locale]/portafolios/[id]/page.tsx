import Link from "next/link";
import { ESTADOS_FORMULARIO } from "@ciudadania/model/enums";
import { eliminarPortafolio, verPortafolio } from "@/controllers/PortafolioController";
import { listarFormularios } from "@/controllers/FormularioController";
import { formatearFecha, resolverIdioma } from "@/lib/idioma";
import { BotonConfirmar } from "@/views/components/BotonConfirmar";
import { MensajeExito } from "@/views/components/MensajeExito";
import { cx, EnlaceBoton, EtiquetaEstado, Migas, Tarjeta, TituloPagina, Vacio } from "@/views/components/ui";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ estado?: string; ok?: string }>;
};

/** Vista de detalle de portafolio + RF06 (formularios del portafolio filtrados por estado). */
export default async function DetallePortafolio({ params, searchParams }: Props) {
  const { idioma, t } = await resolverIdioma(params);
  const { id } = await params;
  const { estado, ok } = await searchParams;
  const filtro = ESTADOS_FORMULARIO.find((e) => e === estado);
  const [portafolio, formularios] = await Promise.all([verPortafolio(id), listarFormularios(id, filtro)]);
  const base = `/${idioma}/portafolios/${id}`;

  return (
    <>
      <Migas etiqueta={t("comun.migas")} items={[{ texto: t("portafolio.lista.titulo"), href: `/${idioma}/portafolios` }, { texto: portafolio.nombre }]} />
      <MensajeExito ok={ok} t={t} />

      <Tarjeta className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primario">{t("portafolio.etiqueta")}</p>
            <h1 className="mt-1 text-2xl font-bold text-tinta break-words sm:text-3xl">{portafolio.nombre}</h1>
            <p className="mt-2 text-tenue break-words">{portafolio.descripcion || t("portafolio.sinDescripcion")}</p>
            <p className="mt-3 text-xs text-tenue">
              {t("portafolio.campos.fechaCreacion")}: {formatearFecha(portafolio.fechaCreacion, idioma)} ·{" "}
              {t("portafolio.totalFormularios", { total: portafolio.totalFormularios })}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <EnlaceBoton variante="secundario" href={`${base}/editar`}>{t("comun.editar")}</EnlaceBoton>
            <BotonConfirmar
              idioma={idioma}
              accion={eliminarPortafolio}
              campos={{ id }}
              textoBoton={t("comun.eliminar")}
              tituloDialogo={t("portafolio.eliminar.titulo")}
              mensajeDialogo={
                portafolio.puedeEliminarse
                  ? t("portafolio.eliminar.mensaje", { nombre: portafolio.nombre })
                  : t("portafolio.eliminar.mensajeConFormularios", { total: portafolio.totalFormularios })
              }
              textoConfirmar={t("comun.siEliminar")}
            />
          </div>
        </div>
      </Tarjeta>

      <TituloPagina
        titulo={t("formulario.lista.titulo")}
        acciones={<EnlaceBoton href={`${base}/formularios/nuevo`}>+ {t("formulario.nuevo")}</EnlaceBoton>}
      />

      <nav aria-label={t("formulario.lista.filtrar")} className="mb-5 flex flex-wrap gap-2">
        {[undefined, ...ESTADOS_FORMULARIO].map((e) => (
          <Link
            key={e ?? "todos"}
            href={e ? `${base}?estado=${e}` : base}
            aria-current={filtro === e ? "page" : undefined}
            className={cx(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 transition",
              filtro === e ? "bg-primario text-white ring-primario" : "bg-white text-tenue ring-borde hover:text-primario",
            )}
          >
            {e ? t(`estados.${e}`) : t("formulario.lista.todos")}
          </Link>
        ))}
      </nav>

      {formularios.length === 0 ? (
        <Vacio
          titulo={filtro ? t("formulario.lista.sinEstado", { estado: t(`estados.${filtro}`) }) : t("formulario.lista.vacio")}
          accion={!filtro && <EnlaceBoton href={`${base}/formularios/nuevo`}>+ {t("formulario.nuevo")}</EnlaceBoton>}
        />
      ) : (
        <ul className="space-y-3">
          {formularios.map((f) => (
            <li key={f.id}>
              <Link
                href={`/${idioma}/formularios/${f.id}`}
                className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-borde transition hover:ring-primario/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="font-bold text-tinta break-words">{f.titulo}</h3>
                  <p className="line-clamp-1 text-sm text-tenue break-words">{f.descripcion}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-tenue">
                  <span>{t("formulario.totalPreguntas", { total: f.totalPreguntas })}</span>
                  <span aria-hidden="true">·</span>
                  <span>{t("formulario.totalReportes", { total: f.totalReportes })}</span>
                  <EtiquetaEstado estado={f.estado} t={t} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
