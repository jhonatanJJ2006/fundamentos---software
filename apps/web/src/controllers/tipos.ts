/** Mensaje traducible: el Controlador entrega claves i18n, la Vista las traduce. */
export interface MensajeVista {
  codigo: string;
  params?: Record<string, string | number>;
}

/** Respuesta de una acción del Controlador hacia la Vista. */
export interface EstadoAccion {
  ok: boolean;
  /** Mensaje general (p. ej. acceso denegado, regla de negocio). */
  mensaje?: MensajeVista;
  /** Mensajes por campo del formulario. */
  errores: Record<string, MensajeVista[]>;
  /** Valores enviados, para no perder lo escrito cuando hay errores. */
  valores?: Record<string, string | string[]>;
}

export const ESTADO_INICIAL: EstadoAccion = { ok: true, errores: {} };

export type Accion = (previo: EstadoAccion, datos: FormData) => Promise<EstadoAccion>;
