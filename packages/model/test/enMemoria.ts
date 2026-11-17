import { EstadoFormulario } from "../src/domain/enums";
import { Formulario } from "../src/domain/Formulario";
import { Portafolio } from "../src/domain/Portafolio";
import { Pregunta } from "../src/domain/Pregunta";
import type {
  RepositorioFormularios,
  RepositorioPortafolios,
  ResumenFormulario,
  ResumenPortafolio,
} from "../src/repositories/interfaces";

let secuencia = 0;
const nuevoId = (prefijo: string) => `${prefijo}-${++secuencia}`;

/** Repositorios en memoria para probar los servicios sin base de datos. */
export class RepoPortafoliosMemoria implements RepositorioPortafolios {
  filas = new Map<string, { nombre: string; descripcion: string; creadorId: string; fecha: Date }>();
  constructor(private readonly formularios?: RepoFormulariosMemoria) {}

  private contar(id: string) {
    return this.formularios ? [...this.formularios.filas.values()].filter((f) => f.portafolioId === id).length : 0;
  }

  async listar(busqueda?: string): Promise<ResumenPortafolio[]> {
    return [...this.filas.entries()]
      .filter(([, p]) => !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
      .map(([id, p]) => ({ id, nombre: p.nombre, descripcion: p.descripcion, fechaCreacion: p.fecha, totalFormularios: this.contar(id), creador: p.creadorId }));
  }
  async buscarPorId(id: string) {
    const p = this.filas.get(id);
    return p ? new Portafolio(p.nombre, p.descripcion, p.creadorId, p.fecha, id, this.contar(id)) : null;
  }
  async existeNombre(nombre: string, exceptoId?: string) {
    return [...this.filas.entries()].some(([id, p]) => id !== exceptoId && p.nombre.toLowerCase() === nombre.toLowerCase());
  }
  async guardar(p: Portafolio) {
    const id = p.id ?? nuevoId("por");
    this.filas.set(id, { nombre: p.nombre, descripcion: p.descripcion, creadorId: p.creadorId, fecha: p.fechaCreacion });
    return id;
  }
  async eliminar(id: string) {
    this.filas.delete(id);
  }
}

interface FilaFormulario {
  portafolioId: string;
  titulo: string;
  descripcion: string;
  consentimiento: string;
  estado: EstadoFormulario;
  reportes: number;
  preguntas: { id: string; enunciado: string; tipo: string; orden: number; obligatoria: boolean; opciones: string[] }[];
}

export class RepoFormulariosMemoria implements RepositorioFormularios {
  filas = new Map<string, FilaFormulario>();

  async listarPorPortafolio(portafolioId: string, estado?: EstadoFormulario): Promise<ResumenFormulario[]> {
    return [...this.filas.entries()]
      .filter(([, f]) => f.portafolioId === portafolioId && (!estado || f.estado === estado))
      .map(([id, f]) => ({ id, titulo: f.titulo, descripcion: f.descripcion, estado: f.estado, fechaCreacion: new Date(), totalPreguntas: f.preguntas.length, totalReportes: f.reportes }));
  }
  async buscarPorId(id: string) {
    const f = this.filas.get(id);
    if (!f) return null;
    const formulario = new Formulario(f.titulo, f.descripcion, f.consentimiento, f.portafolioId, f.estado, id, f.reportes);
    f.preguntas.forEach((p) => formulario.cargarPregunta(Pregunta.crear({ ...p }, p.id)));
    return formulario;
  }
  async guardar(f: Formulario) {
    const id = f.id ?? nuevoId("for");
    const previo = this.filas.get(id);
    this.filas.set(id, {
      portafolioId: f.portafolioId,
      titulo: f.titulo,
      descripcion: f.descripcion,
      consentimiento: f.consentimiento,
      estado: f.estado,
      reportes: previo?.reportes ?? f.totalReportes,
      preguntas: previo?.preguntas ?? [],
    });
    return id;
  }
  async guardarEstructura(f: Formulario) {
    const fila = this.filas.get(f.id!)!;
    fila.preguntas = f.preguntas.map((p) => ({
      id: p.id ?? nuevoId("pre"),
      enunciado: p.enunciado,
      tipo: p.tipo,
      orden: p.orden,
      obligatoria: p.obligatoria,
      opciones: p.opciones.map((o) => o.texto),
    }));
  }
  async eliminar(id: string) {
    this.filas.delete(id);
  }
}
