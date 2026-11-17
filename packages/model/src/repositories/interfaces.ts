import type { EstadoFormulario } from "../domain/enums";
import type { Formulario } from "../domain/Formulario";
import type { Portafolio } from "../domain/Portafolio";
import type { Usuario } from "../domain/Usuario";

/** Fila del listado de portafolios (RF02). */
export interface ResumenPortafolio {
  id: string;
  nombre: string;
  descripcion: string;
  fechaCreacion: Date;
  totalFormularios: number;
  creador: string;
}

/** Fila del listado de formularios (RF06). */
export interface ResumenFormulario {
  id: string;
  titulo: string;
  descripcion: string;
  estado: EstadoFormulario;
  fechaCreacion: Date;
  totalPreguntas: number;
  totalReportes: number;
}

export interface RepositorioUsuarios {
  buscarPorId(id: string): Promise<Usuario | null>;
  listar(): Promise<Usuario[]>;
}

export interface RepositorioPortafolios {
  listar(busqueda?: string): Promise<ResumenPortafolio[]>;
  buscarPorId(id: string): Promise<Portafolio | null>;
  existeNombre(nombre: string, exceptoId?: string): Promise<boolean>;
  /** Inserta (sin id) o actualiza (con id). Devuelve el id. */
  guardar(portafolio: Portafolio): Promise<string>;
  eliminar(id: string): Promise<void>;
}

export interface RepositorioFormularios {
  listarPorPortafolio(portafolioId: string, estado?: EstadoFormulario): Promise<ResumenFormulario[]>;
  /** Carga el agregado completo: formulario + preguntas + opciones + total de reportes. */
  buscarPorId(id: string): Promise<Formulario | null>;
  /** Inserta o actualiza los datos generales y el estado. Devuelve el id. */
  guardar(formulario: Formulario): Promise<string>;
  /** Persiste la estructura (preguntas y opciones) de un formulario en Borrador. */
  guardarEstructura(formulario: Formulario): Promise<void>;
  eliminar(id: string): Promise<void>;
}
