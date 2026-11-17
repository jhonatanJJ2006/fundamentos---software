/**
 * Error de regla de negocio / validación (RNF03).
 * El Modelo no conoce textos: emite CÓDIGOS que la Vista traduce con i18n (RNF01).
 */
export interface DetalleError {
  /** Campo del formulario al que pertenece el error (opcional). */
  campo?: string;
  /** Clave i18n del mensaje, p. ej. "errores.portafolio.nombreObligatorio". */
  codigo: string;
  params?: Record<string, string | number>;
}

export class ErrorDominio extends Error {
  readonly detalles: DetalleError[];

  constructor(detalles: DetalleError | DetalleError[]) {
    const lista = Array.isArray(detalles) ? detalles : [detalles];
    super(lista.map((d) => d.codigo).join(", "));
    this.name = "ErrorDominio";
    this.detalles = lista;
  }
}

/** Acumula errores de validación y lanza todos juntos (un mensaje claro por cada error). */
export class Validador {
  private readonly errores: DetalleError[] = [];

  obligatorio(valor: string | undefined | null, campo: string, codigo: string) {
    if (!valor || valor.trim().length === 0) this.errores.push({ campo, codigo });
    return this;
  }

  longitudMaxima(valor: string | undefined | null, max: number, campo: string, codigo: string) {
    if (valor && valor.trim().length > max) this.errores.push({ campo, codigo, params: { max } });
    return this;
  }

  regla(cumple: boolean, detalle: DetalleError) {
    if (!cumple) this.errores.push(detalle);
    return this;
  }

  agregar(...detalles: DetalleError[]) {
    this.errores.push(...detalles);
    return this;
  }

  get hayErrores() {
    return this.errores.length > 0;
  }

  lanzarSiHayErrores() {
    if (this.hayErrores) throw new ErrorDominio([...this.errores]);
  }
}
