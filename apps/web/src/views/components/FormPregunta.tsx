"use client";

import { useState } from "react";
import { crearTraductor, type Idioma } from "@ciudadania/i18n";
import { TipoPregunta } from "@ciudadania/model/enums";
import type { PreguntaVista } from "@/controllers/FormularioController";
import { agregarPregunta, modificarPregunta } from "@/controllers/PreguntaController";
import { useAccion } from "./useAccion";
import { Alerta, Boton, claseInput, EnlaceBoton, ErroresCampo, Etiqueta, Tarjeta } from "./ui";

const TIPOS = Object.values(TipoPregunta);

/** Vista para agregar (RF10) y modificar (RF11) una pregunta. */
export function FormPregunta({
  idioma,
  formularioId,
  totalPreguntas,
  pregunta,
}: {
  idioma: Idioma;
  formularioId: string;
  totalPreguntas: number;
  pregunta?: PreguntaVista;
}) {
  const t = crearTraductor(idioma);
  const { estado, onSubmit, pendiente } = useAccion(pregunta ? modificarPregunta : agregarPregunta);
  const [tipo, setTipo] = useState<string>(pregunta?.tipo ?? TipoPregunta.TEXTO);
  const [opciones, setOpciones] = useState<string[]>(pregunta?.opciones.length ? pregunta.opciones : ["", ""]);
  const err = estado.errores;
  const maxOrden = pregunta ? totalPreguntas : totalPreguntas + 1;

  const enviado = (campo: string) => {
    const v = estado.valores?.[campo];
    return typeof v === "string" ? v : undefined;
  };
  const enunciado = enviado("enunciado") ?? pregunta?.enunciado ?? "";
  const orden = enviado("orden") ?? String(pregunta?.orden ?? maxOrden);
  const obligatoria = estado.valores ? estado.valores.obligatoria === "on" : (pregunta?.obligatoria ?? true);

  return (
    <Tarjeta>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <input type="hidden" name="idioma" value={idioma} />
        <input type="hidden" name="formularioId" value={formularioId} />
        {pregunta && <input type="hidden" name="id" value={pregunta.id} />}

        {!estado.ok && estado.mensaje && <Alerta tipo="error">{t(estado.mensaje.codigo, estado.mensaje.params)}</Alerta>}

        <div key={`enunciado-${enunciado}`}>
          <Etiqueta htmlFor="enunciado" obligatorio>{t("pregunta.campos.enunciado")}</Etiqueta>
          <textarea
            id="enunciado"
            name="enunciado"
            rows={2}
            maxLength={320}
            defaultValue={enunciado}
            placeholder={t("pregunta.campos.enunciadoPlaceholder")}
            aria-invalid={Boolean(err.enunciado)}
            aria-describedby="enunciado-error"
            className={claseInput}
          />
          <ErroresCampo id="enunciado-error" mensajes={err.enunciado} t={t} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Etiqueta htmlFor="tipo" obligatorio>{t("pregunta.campos.tipo")}</Etiqueta>
            <select
              id="tipo"
              name="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              aria-invalid={Boolean(err.tipo)}
              className={claseInput}
            >
              {TIPOS.map((tp) => (
                <option key={tp} value={tp}>{t(`tipos.${tp}`)}</option>
              ))}
            </select>
            <ErroresCampo id="tipo-error" mensajes={err.tipo} t={t} />
          </div>

          <div key={`orden-${orden}`}>
            <Etiqueta htmlFor="orden" obligatorio>{t("pregunta.campos.orden")}</Etiqueta>
            <input
              id="orden"
              name="orden"
              type="number"
              min={1}
              max={Math.max(maxOrden, 1)}
              defaultValue={orden}
              aria-describedby="orden-ayuda"
              className={claseInput}
            />
            <p id="orden-ayuda" className="mt-1 text-xs text-tenue">{t("pregunta.campos.ordenAyuda", { max: Math.max(maxOrden, 1) })}</p>
          </div>
        </div>

        <label key={`obl-${obligatoria}`} className="flex items-center gap-3 text-sm font-semibold text-tinta">
          <input type="checkbox" name="obligatoria" defaultChecked={obligatoria} className="size-5 rounded accent-primario" />
          {t("pregunta.campos.obligatoria")}
        </label>

        {tipo === TipoPregunta.OPCION_MULTIPLE && (
          <fieldset className="rounded-lg bg-fondo p-4 ring-1 ring-borde">
            <legend className="px-1 text-sm font-semibold text-tinta">
              {t("pregunta.campos.opciones")} <span className="text-peligro" aria-hidden="true">*</span>
            </legend>
            <p className="mb-3 text-xs text-tenue">{t("pregunta.campos.opcionesAyuda")}</p>
            <ol className="space-y-2">
              {opciones.map((op, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-right text-sm text-tenue">{i + 1}.</span>
                  <input
                    name="opciones"
                    value={op}
                    maxLength={160}
                    onChange={(e) => setOpciones(opciones.map((o, j) => (j === i ? e.target.value : o)))}
                    placeholder={t("pregunta.campos.opcionPlaceholder", { n: i + 1 })}
                    aria-label={t("pregunta.campos.opcionPlaceholder", { n: i + 1 })}
                    className={claseInput}
                  />
                  <button
                    type="button"
                    onClick={() => setOpciones(opciones.filter((_, j) => j !== i))}
                    className="shrink-0 rounded-lg px-2 py-2 text-sm text-peligro hover:bg-peligro/10"
                    aria-label={t("pregunta.quitarOpcion", { n: i + 1 })}
                    title={t("pregunta.quitarOpcion", { n: i + 1 })}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => setOpciones([...opciones, ""])}
              className="mt-3 text-sm font-semibold text-primario hover:underline"
            >
              + {t("pregunta.agregarOpcion")}
            </button>
            <ErroresCampo id="opciones-error" mensajes={err.opciones} t={t} />
          </fieldset>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <EnlaceBoton variante="secundario" href={`/${idioma}/formularios/${formularioId}`}>
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
