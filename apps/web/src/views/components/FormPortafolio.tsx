"use client";

import { crearTraductor, type Idioma } from "@ciudadania/i18n";
import { registrarPortafolio, modificarPortafolio, type PortafolioVista } from "@/controllers/PortafolioController";
import { useAccion } from "./useAccion";
import { Alerta, Boton, claseInput, EnlaceBoton, ErroresCampo, Etiqueta, Tarjeta } from "./ui";

/** Vista de registro (RF01) y modificación (RF03) de un portafolio. */
export function FormPortafolio({ idioma, portafolio }: { idioma: Idioma; portafolio?: PortafolioVista }) {
  const t = crearTraductor(idioma);
  const { estado, onSubmit, pendiente } = useAccion(portafolio ? modificarPortafolio : registrarPortafolio);
  const valor = (campo: "nombre" | "descripcion") => {
    const enviado = estado.valores?.[campo];
    return typeof enviado === "string" ? enviado : (portafolio?.[campo] ?? "");
  };
  const err = estado.errores;

  return (
    <Tarjeta>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <input type="hidden" name="idioma" value={idioma} />
        {portafolio && <input type="hidden" name="id" value={portafolio.id} />}

        {!estado.ok && estado.mensaje && <Alerta tipo="error">{t(estado.mensaje.codigo, estado.mensaje.params)}</Alerta>}

        <div>
          <Etiqueta htmlFor="nombre" obligatorio>{t("portafolio.campos.nombre")}</Etiqueta>
          <input
            id="nombre"
            name="nombre"
            defaultValue={valor("nombre")}
            key={`nombre-${valor("nombre")}`}
            maxLength={120}
            placeholder={t("portafolio.campos.nombrePlaceholder")}
            aria-invalid={Boolean(err.nombre)}
            aria-describedby="nombre-error"
            className={claseInput}
          />
          <ErroresCampo id="nombre-error" mensajes={err.nombre} t={t} />
        </div>

        <div>
          <Etiqueta htmlFor="descripcion">{t("portafolio.campos.descripcion")}</Etiqueta>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={4}
            defaultValue={valor("descripcion")}
            key={`descripcion-${valor("descripcion")}`}
            placeholder={t("portafolio.campos.descripcionPlaceholder")}
            aria-invalid={Boolean(err.descripcion)}
            aria-describedby="descripcion-error"
            className={claseInput}
          />
          <ErroresCampo id="descripcion-error" mensajes={err.descripcion} t={t} />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <EnlaceBoton variante="secundario" href={portafolio ? `/${idioma}/portafolios/${portafolio.id}` : `/${idioma}/portafolios`}>
            {t("comun.cancelar")}
          </EnlaceBoton>
          <Boton type="submit" disabled={pendiente}>
            {pendiente ? t("comun.guardando") : t("comun.guardar")}
          </Boton>
        </div>
      </form>
    </Tarjeta>
  );
}
