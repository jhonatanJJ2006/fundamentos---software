"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { ErrorDominio } from "@ciudadania/model";
import { servicios } from "@/lib/servicios";
import { ejecutarAccion, texto } from "./base";
import type { EstadoAccion } from "./tipos";

/* ===================== CONSULTAS (Controlador → Modelo → Vista) ===================== */

export interface PortafolioVista {
  id: string;
  nombre: string;
  descripcion: string;
  fechaCreacion: string;
  totalFormularios: number;
  creador?: string;
  puedeEliminarse: boolean;
}

/** RF02: lista de portafolios con número de formularios y búsqueda por nombre. */
export async function listarPortafolios(busqueda?: string): Promise<PortafolioVista[]> {
  const filas = await servicios.portafolios.listar(busqueda);
  return filas.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    fechaCreacion: p.fechaCreacion.toISOString(),
    totalFormularios: p.totalFormularios,
    creador: p.creador,
    puedeEliminarse: p.totalFormularios === 0,
  }));
}

export async function verPortafolio(id: string): Promise<PortafolioVista> {
  try {
    const p = await servicios.portafolios.obtener(id);
    return {
      id: p.id!,
      nombre: p.nombre,
      descripcion: p.descripcion,
      fechaCreacion: p.fechaCreacion.toISOString(),
      totalFormularios: p.totalFormularios,
      puedeEliminarse: p.puedeEliminarse(),
    };
  } catch (e) {
    if (e instanceof ErrorDominio) notFound();
    throw e;
  }
}

/* ===================== ACCIONES (requieren rol Investigador) ===================== */

/** RF01 */
export async function registrarPortafolio(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  return ejecutarAccion(datos, async (usuario, idioma) => {
    const id = await servicios.portafolios.registrar(
      { nombre: texto(datos, "nombre"), descripcion: texto(datos, "descripcion") },
      usuario,
    );
    revalidatePath(`/${idioma}/portafolios`);
    return `/${idioma}/portafolios/${id}?ok=portafolioCreado`;
  });
}

/** RF03 */
export async function modificarPortafolio(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  return ejecutarAccion(datos, async (_usuario, idioma) => {
    const id = texto(datos, "id");
    await servicios.portafolios.modificar(id, { nombre: texto(datos, "nombre"), descripcion: texto(datos, "descripcion") });
    revalidatePath(`/${idioma}/portafolios`);
    return `/${idioma}/portafolios/${id}?ok=portafolioModificado`;
  });
}

/** RF04 (la confirmación previa la pide la Vista) */
export async function eliminarPortafolio(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  return ejecutarAccion(datos, async (_usuario, idioma) => {
    await servicios.portafolios.eliminar(texto(datos, "id"));
    revalidatePath(`/${idioma}/portafolios`);
    return `/${idioma}/portafolios?ok=portafolioEliminado`;
  });
}
