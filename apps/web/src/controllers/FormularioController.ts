"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { ErrorDominio, EstadoFormulario, type TipoPregunta } from "@ciudadania/model";
import { servicios } from "@/lib/servicios";
import { ejecutarAccion, texto } from "./base";
import type { EstadoAccion } from "./tipos";

/* ===================== CONSULTAS ===================== */

export interface ResumenFormularioVista {
  id: string;
  titulo: string;
  descripcion: string;
  estado: EstadoFormulario;
  fechaCreacion: string;
  totalPreguntas: number;
  totalReportes: number;
}

export interface PreguntaVista {
  id: string;
  enunciado: string;
  tipo: TipoPregunta;
  orden: number;
  obligatoria: boolean;
  opciones: string[];
}

export interface FormularioVista {
  id: string;
  portafolioId: string;
  titulo: string;
  descripcion: string;
  consentimiento: string;
  estado: EstadoFormulario;
  fechaCreacion: string;
  totalReportes: number;
  esEditable: boolean;
  preguntas: PreguntaVista[];
}

/** RF06: formularios de un portafolio, con filtro opcional por estado. */
export async function listarFormularios(portafolioId: string, estado?: string): Promise<ResumenFormularioVista[]> {
  const filas = await servicios.formularios.listar(portafolioId, estado);
  return filas.map((f) => ({ ...f, fechaCreacion: f.fechaCreacion.toISOString() }));
}

/** RF06: detalle con sus preguntas en orden. */
export async function verFormulario(id: string): Promise<FormularioVista> {
  try {
    const f = await servicios.formularios.obtener(id);
    return {
      id: f.id!,
      portafolioId: f.portafolioId,
      titulo: f.titulo,
      descripcion: f.descripcion,
      consentimiento: f.consentimiento,
      estado: f.estado,
      fechaCreacion: f.fechaCreacion.toISOString(),
      totalReportes: f.totalReportes,
      esEditable: f.esEditable(),
      preguntas: f.preguntas.map((p) => ({
        id: p.id!,
        enunciado: p.enunciado,
        tipo: p.tipo,
        orden: p.orden,
        obligatoria: p.obligatoria,
        opciones: p.opciones.map((o) => o.texto),
      })),
    };
  } catch (e) {
    if (e instanceof ErrorDominio) notFound();
    throw e;
  }
}

/* ===================== ACCIONES (requieren rol Investigador) ===================== */

function datosGenerales(datos: FormData) {
  return {
    titulo: texto(datos, "titulo"),
    descripcion: texto(datos, "descripcion"),
    consentimiento: texto(datos, "consentimiento"),
  };
}

/** RF05 */
export async function registrarFormulario(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  return ejecutarAccion(datos, async (_usuario, idioma) => {
    const portafolioId = texto(datos, "portafolioId");
    const id = await servicios.formularios.registrar(portafolioId, datosGenerales(datos));
    revalidatePath(`/${idioma}/portafolios/${portafolioId}`);
    return `/${idioma}/formularios/${id}?ok=formularioCreado`;
  });
}

/** RF07 */
export async function modificarFormulario(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  return ejecutarAccion(datos, async (_usuario, idioma) => {
    const id = texto(datos, "id");
    await servicios.formularios.modificar(id, datosGenerales(datos));
    revalidatePath(`/${idioma}/formularios/${id}`);
    return `/${idioma}/formularios/${id}?ok=formularioModificado`;
  });
}

/** RF08: en Borrador se elimina; con reportes se cierra. */
export async function eliminarFormulario(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  return ejecutarAccion(datos, async (_usuario, idioma) => {
    const id = texto(datos, "id");
    const portafolioId = texto(datos, "portafolioId");
    const resultado = await servicios.formularios.eliminar(id);
    revalidatePath(`/${idioma}/portafolios/${portafolioId}`);
    return resultado === "CERRADO"
      ? `/${idioma}/formularios/${id}?ok=formularioCerradoPorReportes`
      : `/${idioma}/portafolios/${portafolioId}?ok=formularioEliminado`;
  });
}

/** RF09: Borrador → Publicado (≥ 1 pregunta) y Publicado → Cerrado. */
export async function cambiarEstadoFormulario(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  return ejecutarAccion(datos, async (_usuario, idioma) => {
    const id = texto(datos, "id");
    const nuevo = await servicios.formularios.cambiarEstado(id, texto(datos, "estado"));
    revalidatePath(`/${idioma}/formularios/${id}`);
    return `/${idioma}/formularios/${id}?ok=${nuevo === EstadoFormulario.PUBLICADO ? "formularioPublicado" : "formularioCerrado"}`;
  });
}
