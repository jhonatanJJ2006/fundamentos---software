import { Rol } from "./enums";

/** CRC Usuario — conoce id, nombre, correo y rol. Colabora con: Portafolio. */
export class Usuario {
  constructor(
    readonly id: string,
    readonly nombre: string,
    readonly correo: string,
    readonly rol: Rol,
  ) {}

  /** Indica si puede gestionar portafolios, formularios y preguntas (RNF02). */
  esInvestigador(): boolean {
    return this.rol === Rol.INVESTIGADOR;
  }
}
