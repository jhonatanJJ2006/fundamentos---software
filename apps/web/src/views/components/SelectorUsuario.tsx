"use client";

import { useRef } from "react";
import { crearTraductor, type Idioma } from "@ciudadania/i18n";
import { cambiarUsuarioSimulado, type UsuarioVista } from "@/controllers/SesionController";

/** Simula el usuario en sesión (el login está fuera del alcance) para probar RNF02. */
export function SelectorUsuario({
  idioma,
  actual,
  disponibles,
}: {
  idioma: Idioma;
  actual: UsuarioVista | null;
  disponibles: UsuarioVista[];
}) {
  const t = crearTraductor(idioma);
  const form = useRef<HTMLFormElement>(null);

  return (
    <form ref={form} action={cambiarUsuarioSimulado} className="flex min-w-0 items-center gap-2">
      <label htmlFor="usuarioId" className="hidden text-xs text-white/80 lg:inline">
        {t("encabezado.usuarioSimulado")}
      </label>
      <select
        id="usuarioId"
        name="usuarioId"
        defaultValue={actual?.id}
        onChange={() => form.current?.requestSubmit()}
        aria-label={t("encabezado.usuarioSimulado")}
        className="min-w-0 max-w-44 truncate rounded-lg border-0 bg-white/10 py-1.5 pl-2 pr-7 text-xs font-medium text-white ring-1 ring-white/25 focus:ring-2 focus:ring-white sm:max-w-none"
      >
        {disponibles.map((u) => (
          <option key={u.id} value={u.id} className="text-tinta">
            {u.nombre} · {t(`roles.${u.rol}`)}
          </option>
        ))}
      </select>
    </form>
  );
}
