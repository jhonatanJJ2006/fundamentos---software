"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_USUARIO, obtenerUsuarioActual } from "@/lib/sesion";
import { servicios } from "@/lib/servicios";

export interface UsuarioVista {
  id: string;
  nombre: string;
  rol: string;
  esInvestigador: boolean;
}

/** Usuario simulado en sesión y lista de usuarios disponibles para simular. */
export async function consultarSesion(): Promise<{ actual: UsuarioVista | null; disponibles: UsuarioVista[] }> {
  const [actual, todos] = await Promise.all([obtenerUsuarioActual(), servicios.usuarios.listar()]);
  const aVista = (u: NonNullable<typeof actual>): UsuarioVista => ({
    id: u.id,
    nombre: u.nombre,
    rol: u.rol,
    esInvestigador: u.esInvestigador(),
  });
  return { actual: actual ? aVista(actual) : null, disponibles: todos.map(aVista) };
}

/** Cambia el usuario simulado (solo para demostrar RNF02). */
export async function cambiarUsuarioSimulado(datos: FormData): Promise<void> {
  const id = datos.get("usuarioId");
  if (typeof id !== "string" || !(await servicios.usuarios.obtener(id))) return;
  (await cookies()).set(COOKIE_USUARIO, id, { httpOnly: true, sameSite: "lax", path: "/" });
  revalidatePath("/", "layout");
}
