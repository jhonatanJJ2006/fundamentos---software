import { Suspense } from "react";
import Link from "next/link";
import { crearTraductor, type Idioma } from "@ciudadania/i18n";
import { consultarSesion } from "@/controllers/SesionController";
import { SelectorIdioma } from "./SelectorIdioma";
import { SelectorUsuario } from "./SelectorUsuario";

export async function Encabezado({ idioma }: { idioma: Idioma }) {
  const t = crearTraductor(idioma);
  const { actual, disponibles } = await consultarSesion();

  return (
    <header className="bg-primario-oscuro text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3">
        <Link href={`/${idioma}/portafolios`} className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-lg font-black text-primario-oscuro">
            {t("app.nombre").charAt(0)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold leading-tight">{t("app.nombre")}</span>
            <span className="block truncate text-xs text-white/75">{t("app.modulo")}</span>
          </span>
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <SelectorUsuario idioma={idioma} actual={actual} disponibles={disponibles} />
          <Suspense>
            <SelectorIdioma idioma={idioma} />
          </Suspense>
        </div>
      </div>
      {actual && !actual.esInvestigador && (
        <div className="bg-aviso text-sm text-tinta">
          <p className="mx-auto max-w-6xl px-4 py-2 font-medium">{t("encabezado.avisoSoloLectura", { rol: t(`roles.${actual.rol}`) })}</p>
        </div>
      )}
    </header>
  );
}
