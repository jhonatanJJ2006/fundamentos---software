import { EstadoFormulario, ESTADOS_FORMULARIO } from "./enums";
import { ErrorDominio, Validador } from "./errores";
import { DatosPregunta, Pregunta } from "./Pregunta";

export const FORMULARIO_TITULO_MAX = 150;
export const FORMULARIO_DESCRIPCION_MAX = 1000;
export const FORMULARIO_CONSENTIMIENTO_MAX = 5000;

export interface DatosFormulario {
  titulo: string;
  descripcion: string;
  consentimiento: string;
}

/** Resultado de solicitar la eliminación de un formulario (RF08). */
export type ResultadoEliminacion = "ELIMINADO" | "CERRADO";

/**
 * CRC Formulario — conoce id, título, descripción, texto de consentimiento y estado.
 * Agrega, quita y ordena preguntas. Publica (si tiene al menos 1 pregunta) y cierra.
 * Indica si es editable (solo en Borrador).
 * Colabora con: Portafolio, Pregunta, EstadoFormulario.
 */
export class Formulario {
  private _preguntas: Pregunta[] = [];

  constructor(
    public titulo: string,
    public descripcion: string,
    public consentimiento: string,
    readonly portafolioId: string,
    private _estado: EstadoFormulario = EstadoFormulario.BORRADOR,
    readonly id?: string,
    /** Número de reportes recibidos (dato provisto por el módulo de Reportes). */
    readonly totalReportes = 0,
    readonly fechaCreacion: Date = new Date(),
  ) {
    this.titulo = titulo.trim();
    this.descripcion = descripcion.trim();
    this.consentimiento = consentimiento.trim();
  }

  /** RF05: todo formulario nuevo nace en estado Borrador. */
  static crear(datos: DatosFormulario, portafolioId: string): Formulario {
    return new Formulario(datos.titulo ?? "", datos.descripcion ?? "", datos.consentimiento ?? "", portafolioId);
  }

  get estado(): EstadoFormulario {
    return this._estado;
  }

  get preguntas(): readonly Pregunta[] {
    return [...this._preguntas].sort((a, b) => a.orden - b.orden);
  }

  /** Solo un formulario en Borrador permite modificar su estructura (preguntas). */
  esEditable(): boolean {
    return this._estado === EstadoFormulario.BORRADOR;
  }

  tieneReportes(): boolean {
    return this.totalReportes > 0;
  }

  // ---------- Datos generales (RF07) ----------

  actualizarDatos(datos: DatosFormulario): void {
    this.titulo = (datos.titulo ?? "").trim();
    this.descripcion = (datos.descripcion ?? "").trim();
    this.consentimiento = (datos.consentimiento ?? "").trim();
  }

  validar(v: Validador = new Validador()): Validador {
    v.obligatorio(this.titulo, "titulo", "errores.formulario.tituloObligatorio")
      .longitudMaxima(this.titulo, FORMULARIO_TITULO_MAX, "titulo", "errores.formulario.tituloLargo")
      .obligatorio(this.descripcion, "descripcion", "errores.formulario.descripcionObligatoria")
      .longitudMaxima(this.descripcion, FORMULARIO_DESCRIPCION_MAX, "descripcion", "errores.formulario.descripcionLarga")
      .obligatorio(this.consentimiento, "consentimiento", "errores.formulario.consentimientoObligatorio")
      .longitudMaxima(this.consentimiento, FORMULARIO_CONSENTIMIENTO_MAX, "consentimiento", "errores.formulario.consentimientoLargo")
      .regla(ESTADOS_FORMULARIO.includes(this._estado), { codigo: "errores.formulario.estadoInvalido" });
    return v;
  }

  // ---------- Estructura: preguntas (RF10, RF11, RF12) ----------

  private exigirEditable(): void {
    if (!this.esEditable()) {
      throw new ErrorDominio({ codigo: "errores.formulario.estructuraBloqueada" });
    }
  }

  /** Carga una pregunta existente desde persistencia (sin reglas de edición). */
  cargarPregunta(pregunta: Pregunta): void {
    this._preguntas.push(pregunta);
  }

  /** RF10: agrega una pregunta en la posición indicada (o al final) y reordena. */
  agregarPregunta(datos: DatosPregunta): Pregunta {
    this.exigirEditable();
    const pregunta = Pregunta.crear(datos);
    pregunta.validar().lanzarSiHayErrores();
    const lista = this.preguntas.slice();
    const posicion = this.normalizarPosicion(datos.orden, lista.length + 1);
    lista.splice(posicion - 1, 0, pregunta);
    this.renumerar(lista);
    return pregunta;
  }

  /** RF11: modifica una pregunta (enunciado, tipo, orden, obligatoriedad y opciones). */
  modificarPregunta(preguntaId: string, datos: DatosPregunta): Pregunta {
    this.exigirEditable();
    const pregunta = this.buscarPregunta(preguntaId);
    pregunta.actualizar(datos);
    pregunta.validar().lanzarSiHayErrores();
    const lista = this.preguntas.filter((p) => p.id !== preguntaId);
    const posicion = this.normalizarPosicion(datos.orden, lista.length + 1);
    lista.splice(posicion - 1, 0, pregunta);
    this.renumerar(lista);
    return pregunta;
  }

  /** RF12: elimina una pregunta y reordena las restantes (1..n). */
  quitarPregunta(preguntaId: string): void {
    this.exigirEditable();
    this.buscarPregunta(preguntaId);
    this.renumerar(this.preguntas.filter((p) => p.id !== preguntaId));
  }

  /** Reasigna el orden consecutivo 1..n. */
  ordenarPreguntas(): void {
    this.renumerar(this.preguntas.slice());
  }

  buscarPregunta(preguntaId: string): Pregunta {
    const pregunta = this._preguntas.find((p) => p.id === preguntaId);
    if (!pregunta) throw new ErrorDominio({ codigo: "errores.pregunta.noEncontrada" });
    return pregunta;
  }

  private renumerar(lista: Pregunta[]): void {
    lista.forEach((p, i) => (p.orden = i + 1));
    this._preguntas = lista;
  }

  private normalizarPosicion(orden: number | undefined, maximo: number): number {
    if (!orden || !Number.isFinite(orden) || orden < 1) return maximo;
    return Math.min(Math.trunc(orden), maximo);
  }

  // ---------- Ciclo de vida (RF08, RF09) ----------

  /** RF09: Borrador → Publicado, solo si tiene al menos 1 pregunta. */
  publicar(): void {
    if (this._estado !== EstadoFormulario.BORRADOR) {
      throw new ErrorDominio({ codigo: "errores.formulario.transicionInvalida" });
    }
    if (this._preguntas.length < 1) {
      throw new ErrorDominio({ codigo: "errores.formulario.publicarSinPreguntas" });
    }
    this._estado = EstadoFormulario.PUBLICADO;
  }

  /** RF09: Publicado → Cerrado. */
  cerrar(): void {
    if (this._estado !== EstadoFormulario.PUBLICADO) {
      throw new ErrorDominio({ codigo: "errores.formulario.transicionInvalida" });
    }
    this._estado = EstadoFormulario.CERRADO;
  }

  /** RF09: aplica una transición solicitada. Nunca se permite volver a Borrador. */
  cambiarEstado(nuevo: EstadoFormulario): void {
    if (nuevo === EstadoFormulario.PUBLICADO) return this.publicar();
    if (nuevo === EstadoFormulario.CERRADO) return this.cerrar();
    throw new ErrorDominio({ codigo: "errores.formulario.transicionInvalida" });
  }

  /**
   * RF08: un formulario en Borrador sin reportes se elimina.
   * Un formulario con reportes no se elimina: se marca como Cerrado.
   */
  solicitarEliminacion(): ResultadoEliminacion {
    if (this.tieneReportes()) {
      this._estado = EstadoFormulario.CERRADO;
      return "CERRADO";
    }
    if (this._estado !== EstadoFormulario.BORRADOR) {
      throw new ErrorDominio({ codigo: "errores.formulario.soloBorradorSeElimina" });
    }
    return "ELIMINADO";
  }
}
