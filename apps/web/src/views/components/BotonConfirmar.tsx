"use client";

import { useRef } from "react";
import { crearTraductor, type Idioma } from "@ciudadania/i18n";
import type { Accion } from "@/controllers/tipos";
import { useAccion } from "./useAccion";
import { Alerta, Boton, type VarianteBoton } from "./ui";

/**
 * Botón que pide confirmación (diálogo modal) antes de ejecutar una acción del Controlador.
 * Se usa para eliminar (RF04, RF08, RF12) y para cambiar el estado (RF09).
 * Si el Controlador rechaza la acción (regla de negocio o acceso denegado) muestra el motivo.
 */
export function BotonConfirmar({
  idioma,
  accion,
  campos,
  textoBoton,
  tituloDialogo,
  mensajeDialogo,
  textoConfirmar,
  variante = "peligro",
  className,
}: {
  idioma: Idioma;
  accion: Accion;
  campos: Record<string, string>;
  textoBoton: string;
  tituloDialogo: string;
  mensajeDialogo: string;
  textoConfirmar: string;
  variante?: VarianteBoton;
  className?: string;
}) {
  const t = crearTraductor(idioma);
  const dialogo = useRef<HTMLDialogElement>(null);
  const { estado, onSubmit, pendiente } = useAccion(accion);

  return (
    <div className={className}>
      <Boton type="button" variante={variante} onClick={() => dialogo.current?.showModal()} disabled={pendiente} className="w-full sm:w-auto">
        {textoBoton}
      </Boton>

      {!estado.ok && estado.mensaje && (
        <div className="mt-2">
          <Alerta tipo="error">{t(estado.mensaje.codigo, estado.mensaje.params)}</Alerta>
        </div>
      )}

      <dialog
        ref={dialogo}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl p-0 shadow-xl backdrop:bg-tinta/50"
        aria-labelledby={`dlg-${textoBoton}`}
      >
        <form
          onSubmit={(e) => {
            dialogo.current?.close();
            onSubmit(e);
          }}
          className="space-y-4 p-6"
        >
          <input type="hidden" name="idioma" value={idioma} />
          {Object.entries(campos).map(([nombre, valor]) => (
            <input key={nombre} type="hidden" name={nombre} value={valor} />
          ))}
          <h2 id={`dlg-${textoBoton}`} className="text-lg font-bold text-tinta">{tituloDialogo}</h2>
          <p className="text-sm text-tenue">{mensajeDialogo}</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Boton type="button" variante="secundario" onClick={() => dialogo.current?.close()}>
              {t("comun.cancelar")}
            </Boton>
            <Boton type="submit" variante={variante === "peligro" ? "peligro" : "primario"} autoFocus>
              {textoConfirmar}
            </Boton>
          </div>
        </form>
      </dialog>
    </div>
  );
}
