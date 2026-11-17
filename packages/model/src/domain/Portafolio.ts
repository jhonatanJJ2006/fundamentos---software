import { ErrorDominio, Validador } from "./errores";
import type { Formulario } from "./Formulario";

export const PORTAFOLIO_NOMBRE_MAX = 100;
export const PORTAFOLIO_DESCRIPCION_MAX = 500;

export interface DatosPortafolio {
  nombre: string;
  descripcion?: string;
}

/**
 * CRC Portafolio — conoce id, nombre, descripción, fecha de creación y su creador.
 * Agrega, quita y lista sus formularios. Valida nombre obligatorio y único.
 * Indica si puede eliminarse (sin formularios).
 * Colabora con: Formulario, Usuario.
 */
export class Portafolio {
  private _formularios: Formulario[] = [];

  constructor(
    public nombre: string,
    public descripcion: string,
    readonly creadorId: string,
    readonly fechaCreacion: Date = new Date(),
    readonly id?: string,
    /** Cantidad de formularios (cuando no se cargan completos). */
    private _totalFormularios = 0,
  ) {
    this.nombre = nombre.trim();
    this.descripcion = (descripcion ?? "").trim();
  }

  /** RF01: la fecha de creación se asigna automáticamente. */
  static crear(datos: DatosPortafolio, creadorId: string): Portafolio {
    return new Portafolio(datos.nombre ?? "", datos.descripcion ?? "", creadorId, new Date());
  }

  get totalFormularios(): number {
    return Math.max(this._totalFormularios, this._formularios.length);
  }

  agregarFormulario(formulario: Formulario): void {
    this._formularios.push(formulario);
  }

  quitarFormulario(formularioId: string): void {
    this._formularios = this._formularios.filter((f) => f.id !== formularioId);
    this._totalFormularios = this._formularios.length;
  }

  listarFormularios(): readonly Formulario[] {
    return this._formularios;
  }

  /** RF03 */
  actualizar(datos: DatosPortafolio): void {
    this.nombre = (datos.nombre ?? "").trim();
    this.descripcion = (datos.descripcion ?? "").trim();
  }

  /**
   * Valida nombre obligatorio, longitudes y nombre único.
   * @param nombreYaExiste resultado de consultar al repositorio si otro portafolio usa el nombre.
   */
  validar(nombreYaExiste: boolean, v: Validador = new Validador()): Validador {
    v.obligatorio(this.nombre, "nombre", "errores.portafolio.nombreObligatorio")
      .longitudMaxima(this.nombre, PORTAFOLIO_NOMBRE_MAX, "nombre", "errores.portafolio.nombreLargo")
      .longitudMaxima(this.descripcion, PORTAFOLIO_DESCRIPCION_MAX, "descripcion", "errores.portafolio.descripcionLarga");
    if (this.nombre) {
      v.regla(!nombreYaExiste, { campo: "nombre", codigo: "errores.portafolio.nombreDuplicado", params: { nombre: this.nombre } });
    }
    return v;
  }

  /** RF04: solo se elimina si no contiene formularios. */
  puedeEliminarse(): boolean {
    return this.totalFormularios === 0;
  }

  exigirEliminable(): void {
    if (!this.puedeEliminarse()) {
      throw new ErrorDominio({ codigo: "errores.portafolio.tieneFormularios", params: { total: this.totalFormularios } });
    }
  }
}
