"use server";

import { revalidatePath } from "next/cache";
import type { DatosPregunta } from "@ciudadania/model";
import { servicios } from "@/lib/servicios";
import { ejecutarAccion, texto } from "./base";
import type { EstadoAccion } from "./tipos";

function datosPregunta(datos: FormData): DatosPregunta {
  const orden = Number.parseInt(texto(datos, "orden"), 10);
  return {
    enunciado: texto(datos, "enunciado"),
    tipo: texto(datos, "tipo"),
    orden: Number.isNaN(orden) ? undefined : orden,
    obligatoria: datos.get("obligatoria") === "on",
    opciones: datos.getAll("opciones").filter((v): v is string => typeof v === "string"),
  };
}

/** RF10 */
export async function agregarPregunta(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  return ejecutarAccion(datos, async (_usuario, idioma) => {
    const formularioId = texto(datos, "formularioId");
    await servicios.preguntas.agregar(formularioId, datosPregunta(datos));
    revalidatePath(`/${idioma}/formularios/${formularioId}`);
    return `/${idioma}/formularios/${formularioId}?ok=preguntaAgregada`;
  });
}

/** RF11 */
export async function modificarPregunta(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  return ejecutarAccion(datos, async (_usuario, idioma) => {
    const formularioId = texto(datos, "formularioId");
    await servicios.preguntas.modificar(formularioId, texto(datos, "id"), datosPregunta(datos));
    revalidatePath(`/${idioma}/formularios/${formularioId}`);
    return `/${idioma}/formularios/${formularioId}?ok=preguntaModificada`;
  });
}

/** RF12: elimina (previa confirmación en la Vista) y reordena las restantes. */
export async function eliminarPregunta(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  return ejecutarAccion(datos, async (_usuario, idioma) => {
    const formularioId = texto(datos, "formularioId");
    await servicios.preguntas.eliminar(formularioId, texto(datos, "id"));
    revalidatePath(`/${idioma}/formularios/${formularioId}`);
    return `/${idioma}/formularios/${formularioId}?ok=preguntaEliminada`;
  });
}
