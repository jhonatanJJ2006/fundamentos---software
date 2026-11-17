import "server-only";
import { cookies } from "next/headers";
import type { Usuario } from "@ciudadania/model";
import { servicios } from "./servicios";

/**
 * El inicio de sesión está fuera del alcance del módulo: se SIMULA el usuario en sesión
 * con una cookie que guarda su id. Por defecto, el usuario es el Investigador.
 */
export const COOKIE_USUARIO = "ciudadania_usuario";
export const USUARIO_POR_DEFECTO = "usr-investigador";

export async function obtenerUsuarioActual(): Promise<Usuario | null> {
  const almacen = await cookies();
  const id = almacen.get(COOKIE_USUARIO)?.value ?? USUARIO_POR_DEFECTO;
  return servicios.usuarios.obtener(id);
}
