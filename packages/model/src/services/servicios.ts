import { EstadoFormulario, ESTADOS_FORMULARIO } from "../domain/enums";
import { ErrorDominio } from "../domain/errores";
import { DatosFormulario, Formulario, ResultadoEliminacion } from "../domain/Formulario";
import { DatosPortafolio, Portafolio } from "../domain/Portafolio";
import type { DatosPregunta } from "../domain/Pregunta";
import type { Usuario } from "../domain/Usuario";
import type {
  RepositorioFormularios,
  RepositorioPortafolios,
  RepositorioUsuarios,
  ResumenFormulario,
  ResumenPortafolio,
} from "../repositories/interfaces";

/**
 * Servicios del MODELO: orquestan las clases de dominio y la persistencia.
 * No conocen HTTP, cookies ni idiomas: eso es responsabilidad del Controlador y la Vista.
 */

export class UsuarioService {
  constructor(private readonly usuarios: RepositorioUsuarios) {}

  obtener(id: string): Promise<Usuario | null> {
    return this.usuarios.buscarPorId(id);
  }

  listar(): Promise<Usuario[]> {
    return this.usuarios.listar();
  }
}

export class PortafolioService {
  constructor(private readonly portafolios: RepositorioPortafolios) {}

  /** RF02 */
  listar(busqueda?: string): Promise<ResumenPortafolio[]> {
    return this.portafolios.listar(busqueda);
  }

  async obtener(id: string): Promise<Portafolio> {
    const p = await this.portafolios.buscarPorId(id);
    if (!p) throw new ErrorDominio({ codigo: "errores.portafolio.noEncontrado" });
    return p;
  }

  /** RF01 */
  async registrar(datos: DatosPortafolio, creador: Usuario): Promise<string> {
    const portafolio = Portafolio.crear(datos, creador.id);
    const duplicado = portafolio.nombre ? await this.portafolios.existeNombre(portafolio.nombre) : false;
    portafolio.validar(duplicado).lanzarSiHayErrores();
    return this.portafolios.guardar(portafolio);
  }

  /** RF03 */
  async modificar(id: string, datos: DatosPortafolio): Promise<void> {
    const portafolio = await this.obtener(id);
    portafolio.actualizar(datos);
    const duplicado = portafolio.nombre ? await this.portafolios.existeNombre(portafolio.nombre, id) : false;
    portafolio.validar(duplicado).lanzarSiHayErrores();
    await this.portafolios.guardar(portafolio);
  }

  /** RF04 */
  async eliminar(id: string): Promise<void> {
    const portafolio = await this.obtener(id);
    portafolio.exigirEliminable();
    await this.portafolios.eliminar(id);
  }
}

export class FormularioService {
  constructor(
    private readonly formularios: RepositorioFormularios,
    private readonly portafolios: RepositorioPortafolios,
  ) {}

  /** RF06: lista y filtra por estado. */
  async listar(portafolioId: string, estado?: string): Promise<ResumenFormulario[]> {
    const filtro = ESTADOS_FORMULARIO.find((e) => e === estado);
    return this.formularios.listarPorPortafolio(portafolioId, filtro);
  }

  /** RF06: detalle con sus preguntas en orden. */
  async obtener(id: string): Promise<Formulario> {
    const f = await this.formularios.buscarPorId(id);
    if (!f) throw new ErrorDominio({ codigo: "errores.formulario.noEncontrado" });
    return f;
  }

  /** RF05 */
  async registrar(portafolioId: string, datos: DatosFormulario): Promise<string> {
    const portafolio = await this.portafolios.buscarPorId(portafolioId);
    if (!portafolio) throw new ErrorDominio({ codigo: "errores.portafolio.noEncontrado" });
    const formulario = Formulario.crear(datos, portafolioId);
    formulario.validar().lanzarSiHayErrores();
    return this.formularios.guardar(formulario);
  }

  /** RF07: título, descripción y consentimiento (permitido en cualquier estado). */
  async modificar(id: string, datos: DatosFormulario): Promise<void> {
    const formulario = await this.obtener(id);
    formulario.actualizarDatos(datos);
    formulario.validar().lanzarSiHayErrores();
    await this.formularios.guardar(formulario);
  }

  /** RF08: elimina si está en Borrador; si tiene reportes, lo cierra. */
  async eliminar(id: string): Promise<ResultadoEliminacion> {
    const formulario = await this.obtener(id);
    const resultado = formulario.solicitarEliminacion();
    if (resultado === "CERRADO") await this.formularios.guardar(formulario);
    else await this.formularios.eliminar(id);
    return resultado;
  }

  /** RF09 */
  async cambiarEstado(id: string, nuevoEstado: string): Promise<EstadoFormulario> {
    const formulario = await this.obtener(id);
    const destino = ESTADOS_FORMULARIO.find((e) => e === nuevoEstado);
    if (!destino) throw new ErrorDominio({ codigo: "errores.formulario.estadoInvalido" });
    formulario.cambiarEstado(destino);
    await this.formularios.guardar(formulario);
    return formulario.estado;
  }
}

export class PreguntaService {
  constructor(private readonly formularios: RepositorioFormularios) {}

  private async cargar(formularioId: string): Promise<Formulario> {
    const f = await this.formularios.buscarPorId(formularioId);
    if (!f) throw new ErrorDominio({ codigo: "errores.formulario.noEncontrado" });
    return f;
  }

  /** RF10 */
  async agregar(formularioId: string, datos: DatosPregunta): Promise<void> {
    const formulario = await this.cargar(formularioId);
    formulario.agregarPregunta(datos);
    await this.formularios.guardarEstructura(formulario);
  }

  /** RF11 */
  async modificar(formularioId: string, preguntaId: string, datos: DatosPregunta): Promise<void> {
    const formulario = await this.cargar(formularioId);
    formulario.modificarPregunta(preguntaId, datos);
    await this.formularios.guardarEstructura(formulario);
  }

  /** RF12: elimina y reordena las restantes. */
  async eliminar(formularioId: string, preguntaId: string): Promise<void> {
    const formulario = await this.cargar(formularioId);
    formulario.quitarPregunta(preguntaId);
    await this.formularios.guardarEstructura(formulario);
  }
}
