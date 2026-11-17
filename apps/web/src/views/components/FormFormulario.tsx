"use client";

import { crearTraductor, type Idioma } from "@ciudadania/i18n";
import { modificarFormulario, registrarFormulario, type FormularioVista } from "@/controllers/FormularioController";
import { useAccion } from "./useAccion";
import { Alerta, Boton, claseInput, EnlaceBoton, ErroresCampo, Etiqueta, Tarjeta } from "./ui";

type Campo = "titulo" | "descripcion" | "consentimiento";

/** Vista de registro (RF05) y modificación (RF07) de un formulario. */
export function FormFormulario({
  idioma,
  portafolioId,
  formulario,
}: {
  idioma: Idioma;
  portafolioId: string;
  formulario?: FormularioVista;
}) {
  const t = crearTraductor(idioma);
  const { estado, onSubmit, pendiente } = useAccion(formulario ? modificarFormulario : registrarFormulario);
  const valor = (campo: Campo) => {
    const enviado = estado.valores?.[campo];
    return typeof enviado === "string" ? enviado : (formulario?.[campo] ?? "");
  };
  const err = estado.errores;

  const campos: { id: Campo; filas?: number; max: number }[] = [
    { id: "titulo", max: 160 },
    { id: "descripcion", filas: 3, max: 1100 },
    { id: "consentimiento", filas: 6, max: 5100 },
  ];

  return (
    <Tarjeta>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <input type="hidden" name="idioma" value={idioma} />
        <input type="hidden" name="portafolioId" value={portafolioId} />
        {formulario && <input type="hidden" name="id" value={formulario.id} />}

        {!estado.ok && estado.mensaje && <Alerta tipo="error">{t(estado.mensaje.codigo, estado.mensaje.params)}</Alerta>}
        {formulario && !formulario.esEditable && <Alerta tipo="info">{t("formulario.avisoSoloDatos")}</Alerta>}

        {campos.map(({ id, filas, max }) => {
          const comun = {
            id,
            name: id,
            defaultValue: valor(id),
            maxLength: max,
            placeholder: t(`formulario.campos.${id}Placeholder`),
            "aria-invalid": Boolean(err[id]),
            "aria-describedby": `${id}-error`,
            className: claseInput,
          };
          return (
            <div key={`${id}-${valor(id)}`}>
              <Etiqueta htmlFor={id} obligatorio>{t(`formulario.campos.${id}`)}</Etiqueta>
              {filas ? <textarea rows={filas} {...comun} /> : <input {...comun} />}
              <ErroresCampo id={`${id}-error`} mensajes={err[id]} t={t} />
            </div>
          );
        })}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <EnlaceBoton
            variante="secundario"
            href={formulario ? `/${idioma}/formularios/${formulario.id}` : `/${idioma}/portafolios/${portafolioId}`}
          >
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
