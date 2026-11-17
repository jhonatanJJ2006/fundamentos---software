import { TipoPregunta, TIPOS_PREGUNTA } from "./enums";
import { Opcion } from "./Opcion";
import { Validador } from "./errores";

export const PREGUNTA_ENUNCIADO_MAX = 300;
export const MINIMO_OPCIONES = 2;

export interface DatosPregunta {
  enunciado: string;
  tipo: TipoPregunta | string;
  orden?: number;
  obligatoria: boolean;
  opciones?: string[];
}

/**
 * CRC Pregunta — conoce id, enunciado, tipo, orden y si es obligatoria.
 * Agrega y quita opciones. Valida que una pregunta de opción múltiple tenga al menos 2 opciones.
 * Colabora con: Formulario, Opcion, TipoPregunta.
 */
export class Pregunta {
  private _opciones: Opcion[] = [];

  constructor(
    public enunciado: string,
    public tipo: TipoPregunta,
    public orden: number,
    public obligatoria: boolean,
    readonly id?: string,
  ) {
    this.enunciado = enunciado.trim();
  }

  static crear(datos: DatosPregunta, id?: string): Pregunta {
    const p = new Pregunta(datos.enunciado ?? "", datos.tipo as TipoPregunta, datos.orden ?? 0, datos.obligatoria, id);
    (datos.opciones ?? []).forEach((texto) => p.agregarOpcion(texto));
    return p;
  }

  get opciones(): readonly Opcion[] {
    return this._opciones;
  }

  esOpcionMultiple(): boolean {
    return this.tipo === TipoPregunta.OPCION_MULTIPLE;
  }

  agregarOpcion(texto: string, id?: string): Opcion {
    const opcion = new Opcion(texto, this._opciones.length + 1, id);
    this._opciones.push(opcion);
    return opcion;
  }

  quitarOpcion(orden: number): void {
    this._opciones = this._opciones.filter((o) => o.orden !== orden);
    this._opciones.forEach((o, i) => (o.orden = i + 1));
  }

  /** Reemplaza todos los datos editables (RF11). */
  actualizar(datos: DatosPregunta): void {
    this.enunciado = (datos.enunciado ?? "").trim();
    this.tipo = datos.tipo as TipoPregunta;
    this.obligatoria = datos.obligatoria;
    this._opciones = [];
    (datos.opciones ?? []).forEach((texto) => this.agregarOpcion(texto));
  }

  validar(v: Validador = new Validador()): Validador {
    v.obligatorio(this.enunciado, "enunciado", "errores.pregunta.enunciadoObligatorio");
    v.longitudMaxima(this.enunciado, PREGUNTA_ENUNCIADO_MAX, "enunciado", "errores.pregunta.enunciadoLargo");
    v.regla(TIPOS_PREGUNTA.includes(this.tipo), { campo: "tipo", codigo: "errores.pregunta.tipoInvalido" });

    if (this.esOpcionMultiple()) {
      const conTexto = this._opciones.filter((o) => o.texto.length > 0);
      v.regla(conTexto.length >= MINIMO_OPCIONES, {
        campo: "opciones",
        codigo: "errores.pregunta.minimoOpciones",
        params: { min: MINIMO_OPCIONES },
      });
      this._opciones.forEach((o) => o.validar(v));
      const textos = conTexto.map((o) => o.texto.toLowerCase());
      v.regla(new Set(textos).size === textos.length, { campo: "opciones", codigo: "errores.opcion.duplicada" });
    } else {
      // Solo las preguntas de opción múltiple tienen opciones.
      this._opciones = [];
    }
    return v;
  }
}
