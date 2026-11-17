/** «enumeration» EstadoFormulario — ciclo de vida de un formulario. */
export enum EstadoFormulario {
  BORRADOR = "BORRADOR",
  PUBLICADO = "PUBLICADO",
  CERRADO = "CERRADO",
}

/** «enumeration» TipoPregunta — tipos de pregunta soportados. */
export enum TipoPregunta {
  OPCION_MULTIPLE = "OPCION_MULTIPLE",
  TEXTO = "TEXTO",
  SI_NO = "SI_NO",
  UBICACION_GPS = "UBICACION_GPS",
  IMAGEN = "IMAGEN",
}

export enum Rol {
  INVESTIGADOR = "INVESTIGADOR",
  PARTICIPANTE = "PARTICIPANTE",
  REVISOR = "REVISOR",
  ADMINISTRADOR = "ADMINISTRADOR",
}

export const ESTADOS_FORMULARIO = Object.values(EstadoFormulario);
export const TIPOS_PREGUNTA = Object.values(TipoPregunta);
