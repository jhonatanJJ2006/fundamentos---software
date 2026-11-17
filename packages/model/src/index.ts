/**
 * @ciudadania/model — capa MODELO del patrón MVC.
 * Contiene las entidades de dominio (tarjetas CRC), sus reglas de negocio,
 * los repositorios de persistencia y los servicios que las orquestan.
 */
export * from "./domain/enums";
export * from "./domain/errores";
export * from "./domain/Usuario";
export * from "./domain/Opcion";
export * from "./domain/Pregunta";
export * from "./domain/Formulario";
export * from "./domain/Portafolio";
export * from "./repositories/interfaces";
export * from "./services/servicios";

import {
  PrismaRepositorioFormularios,
  PrismaRepositorioPortafolios,
  PrismaRepositorioUsuarios,
} from "./repositories/prisma/PrismaRepositorios";
import { FormularioService, PortafolioService, PreguntaService, UsuarioService } from "./services/servicios";

/** Ensambla los servicios con la persistencia en PostgreSQL (Neon) vía Prisma. */
export function crearServicios() {
  const portafolios = new PrismaRepositorioPortafolios();
  const formularios = new PrismaRepositorioFormularios();
  return {
    usuarios: new UsuarioService(new PrismaRepositorioUsuarios()),
    portafolios: new PortafolioService(portafolios),
    formularios: new FormularioService(formularios, portafolios),
    preguntas: new PreguntaService(formularios),
  };
}
export type Servicios = ReturnType<typeof crearServicios>;
