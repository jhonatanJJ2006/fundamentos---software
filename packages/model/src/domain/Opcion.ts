import { Validador } from "./errores";

export const OPCION_TEXTO_MAX = 150;

/** CRC Opcion — conoce id, texto y orden. Valida texto no vacío. Colabora con: Pregunta. */
export class Opcion {
  constructor(
    public texto: string,
    public orden: number,
    readonly id?: string,
  ) {
    this.texto = texto.trim();
  }

  validar(v: Validador = new Validador()): Validador {
    v.obligatorio(this.texto, `opciones.${this.orden}`, "errores.opcion.textoObligatorio");
    v.longitudMaxima(this.texto, OPCION_TEXTO_MAX, `opciones.${this.orden}`, "errores.opcion.textoLargo");
    return v;
  }
}
