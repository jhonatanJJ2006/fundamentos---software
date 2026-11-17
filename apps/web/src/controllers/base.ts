import "server-only";
import { redirect } from "next/navigation";
import { ErrorDominio, type Usuario } from "@ciudadania/model";
import { esIdioma, IDIOMA_POR_DEFECTO, type Idioma } from "@ciudadania/i18n";
import { obtenerUsuarioActual } from "@/lib/sesion";
import type { EstadoAccion } from "./tipos";

/** RNF01: el Controlador recibe el idioma elegido (campo oculto del formulario) y lo pasa a la Vista. */
export function leerIdioma(datos: FormData): Idioma {
  const valor = datos.get("idioma");
  return esIdioma(valor) ? valor : IDIOMA_POR_DEFECTO;
}

export function texto(datos: FormData, campo: string): string {
  const valor = datos.get(campo);
  return typeof valor === "string" ? valor : "";
}

function valoresDe(datos: FormData): Record<string, string | string[]> {
  const valores: Record<string, string | string[]> = {};
  for (const clave of new Set(datos.keys())) {
    if (clave.startsWith("$")) continue;
    const todos = datos.getAll(clave).filter((v): v is string => typeof v === "string");
    valores[clave] = todos.length > 1 || clave === "opciones" ? todos : (todos[0] ?? "");
  }
  return valores;
}

/**
 * Plantilla común de toda acción del Controlador:
 * 1. RNF02 — verifica el rol del usuario en sesión ANTES de llamar al Modelo.
 * 2. Llama al Modelo.
 * 3. RNF03 — captura los errores de negocio y decide qué mostrar en la Vista (sin cerrarse).
 * 4. Si todo sale bien, redirige a la vista correspondiente en el idioma elegido.
 */
export async function ejecutarAccion(
  datos: FormData,
  accion: (usuario: Usuario, idioma: Idioma) => Promise<string>,
): Promise<EstadoAccion> {
  const idioma = leerIdioma(datos);
  const usuario = await obtenerUsuarioActual();

  if (!usuario || !usuario.esInvestigador()) {
    return { ok: false, mensaje: { codigo: "errores.acceso.denegado" }, errores: {}, valores: valoresDe(datos) };
  }

  let destino: string;
  try {
    destino = await accion(usuario, idioma);
  } catch (e) {
    if (e instanceof ErrorDominio) {
      const errores: EstadoAccion["errores"] = {};
      const generales = [];
      for (const d of e.detalles) {
        const campo = d.campo?.startsWith("opciones") ? "opciones" : d.campo;
        if (campo) (errores[campo] ??= []).push({ codigo: d.codigo, params: d.params });
        else generales.push({ codigo: d.codigo, params: d.params });
      }
      return {
        ok: false,
        mensaje: generales[0] ?? { codigo: "errores.general.revisarCampos" },
        errores,
        valores: valoresDe(datos),
      };
    }
    console.error("[Controlador] Error inesperado:", e);
    return { ok: false, mensaje: { codigo: "errores.general.inesperado" }, errores: {}, valores: valoresDe(datos) };
  }
  redirect(destino);
}
