import Link from "next/link";
import type { Metadata } from "next";
import { traducir, esIdioma } from "@ciudadania/i18n";
import { listarPortafolios } from "@/controllers/PortafolioController";
import { formatearFecha, resolverIdioma } from "@/lib/idioma";
import { MensajeExito } from "@/views/components/MensajeExito";
import { Boton, claseInput, EnlaceBoton, TituloPagina, Vacio } from "@/views/components/ui";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; ok?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: traducir(esIdioma(locale) ? locale : "es", "portafolio.lista.titulo") };
}

/** Vista RF02 — Consultar portafolios (con número de formularios y búsqueda por nombre). */
export default async function PaginaPortafolios({ params, searchParams }: Props) {
  const { idioma, t } = await resolverIdioma(params);
  const { q = "", ok } = await searchParams;
  const portafolios = await listarPortafolios(q);

  return (
    <>
      <MensajeExito ok={ok} t={t} />
      <TituloPagina
        titulo={t("portafolio.lista.titulo")}
        subtitulo={t("portafolio.lista.subtitulo")}
        acciones={<EnlaceBoton href={`/${idioma}/portafolios/nuevo`}>+ {t("portafolio.nuevo")}</EnlaceBoton>}
      />

      <form role="search" className="mb-6 flex flex-col gap-2 sm:flex-row" action={`/${idioma}/portafolios`}>
        <label htmlFor="q" className="sr-only">{t("portafolio.lista.buscar")}</label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder={t("portafolio.lista.buscarPlaceholder")} className={claseInput} />
        <div className="flex gap-2">
          <Boton type="submit" variante="secundario" className="flex-1 sm:flex-none">{t("comun.buscar")}</Boton>
          {q && <EnlaceBoton href={`/${idioma}/portafolios`} variante="fantasma" className="flex-1 sm:flex-none">{t("comun.limpiar")}</EnlaceBoton>}
        </div>
      </form>

      {q && <p className="mb-4 text-sm text-tenue">{t("portafolio.lista.resultados", { total: portafolios.length, q })}</p>}

      {portafolios.length === 0 ? (
        <Vacio
          titulo={q ? t("portafolio.lista.sinResultados") : t("portafolio.lista.vacio")}
          texto={q ? undefined : t("portafolio.lista.vacioAyuda")}
          accion={!q && <EnlaceBoton href={`/${idioma}/portafolios/nuevo`}>+ {t("portafolio.nuevo")}</EnlaceBoton>}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portafolios.map((p) => (
            <li key={p.id}>
              <Link
                href={`/${idioma}/portafolios/${p.id}`}
                className="group flex h-full flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-borde transition hover:shadow-md hover:ring-primario/50"
              >
                <h2 className="text-lg font-bold text-tinta break-words group-hover:text-primario">{p.nombre}</h2>
                <p className="mt-1 line-clamp-3 flex-1 text-sm text-tenue break-words">{p.descripcion || t("portafolio.sinDescripcion")}</p>
                <dl className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-borde pt-3 text-xs text-tenue">
                  <div>
                    <dt className="sr-only">{t("portafolio.campos.formularios")}</dt>
                    <dd className="rounded-full bg-primario/10 px-2.5 py-0.5 font-semibold text-primario">
                      {t("portafolio.totalFormularios", { total: p.totalFormularios })}
                    </dd>
                  </div>
                  <div>
                    <dt className="sr-only">{t("portafolio.campos.fechaCreacion")}</dt>
                    <dd>{formatearFecha(p.fechaCreacion, idioma)}</dd>
                  </div>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
