"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { ESTADO_INICIAL, type Accion } from "@/controllers/tipos";

/**
 * Conecta un formulario de la Vista con una acción del Controlador.
 * Se envía con onSubmit (no con action=) para que React no limpie los campos
 * cuando el Controlador devuelve errores: el usuario no pierde lo que escribió.
 */
export function useAccion(accion: Accion) {
  const [estado, despachar, pendiente] = useActionState(accion, ESTADO_INICIAL);

  function onSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    startTransition(() => despachar(datos));
  }

  return { estado, onSubmit, pendiente };
}
