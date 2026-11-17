"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { crearTraductor, IDIOMAS, type Idioma } from "@ciudadania/i18n";
import { cx } from "./ui";

/**
 * RNF01: cambia de idioma sin perder lo que el usuario está viendo:
 * conserva la misma ruta y los mismos filtros (query string), solo reemplaza /es ↔ /en.
 */
export function SelectorIdioma({ idioma }: { idioma: Idioma }) {
  const t = crearTraductor(idioma);
  const ruta = usePathname();
  const query = useSearchParams();

  const destino = (nuevo: Idioma) => {
    const partes = ruta.split("/");
    partes[1] = nuevo;
    const params = new URLSearchParams(query.toString());
    params.delete("ok");
    const qs = params.toString();
    return `${partes.join("/")}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div role="group" aria-label={t("encabezado.idioma")} className="inline-flex rounded-lg bg-white/10 p-0.5 ring-1 ring-white/25">
      {IDIOMAS.map((i) => (
        <Link
          key={i}
          href={destino(i)}
          replace
          scroll={false}
          hrefLang={i}
          aria-current={i === idioma ? "true" : undefined}
          className={cx(
            "rounded-md px-2.5 py-1 text-xs font-bold uppercase transition",
            i === idioma ? "bg-white text-primario-oscuro" : "text-white/85 hover:bg-white/15",
          )}
          title={t(`idiomas.${i}`)}
        >
          {i}
        </Link>
      ))}
    </div>
  );
}
