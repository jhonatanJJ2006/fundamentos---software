"use client";

import { useParams } from "next/navigation";
import { crearTraductor, esIdioma } from "@ciudadania/i18n";
import { EnlaceBoton, Vacio } from "@/views/components/ui";

export default function NoEncontrado() {
  const { locale } = useParams<{ locale: string }>();
  const idioma = esIdioma(locale) ? locale : "es";
  const t = crearTraductor(idioma);
  return (
    <Vacio
      titulo={t("errores.general.noEncontrado")}
      texto={t("errores.general.noEncontradoAyuda")}
      accion={<EnlaceBoton href={`/${idioma}/portafolios`}>{t("comun.irInicio")}</EnlaceBoton>}
    />
  );
}
