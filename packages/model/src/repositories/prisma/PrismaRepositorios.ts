import { prisma, Prisma } from "@ciudadania/db";
import { EstadoFormulario, Rol, TipoPregunta } from "../../domain/enums";
import { ErrorDominio } from "../../domain/errores";
import { Formulario } from "../../domain/Formulario";
import { Portafolio } from "../../domain/Portafolio";
import { Pregunta } from "../../domain/Pregunta";
import { Usuario } from "../../domain/Usuario";
import type {
  RepositorioFormularios,
  RepositorioPortafolios,
  RepositorioUsuarios,
  ResumenFormulario,
  ResumenPortafolio,
} from "../interfaces";

function esViolacionUnica(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export class PrismaRepositorioUsuarios implements RepositorioUsuarios {
  async buscarPorId(id: string): Promise<Usuario | null> {
    const u = await prisma.usuario.findUnique({ where: { id } });
    return u ? new Usuario(u.id, u.nombre, u.correo, u.rol as Rol) : null;
  }

  async listar(): Promise<Usuario[]> {
    const lista = await prisma.usuario.findMany({ orderBy: { nombre: "asc" } });
    return lista.map((u) => new Usuario(u.id, u.nombre, u.correo, u.rol as Rol));
  }
}

export class PrismaRepositorioPortafolios implements RepositorioPortafolios {
  async listar(busqueda?: string): Promise<ResumenPortafolio[]> {
    const texto = busqueda?.trim();
    const filas = await prisma.portafolio.findMany({
      where: texto ? { nombre: { contains: texto, mode: "insensitive" } } : undefined,
      include: { _count: { select: { formularios: true } }, creador: { select: { nombre: true } } },
      orderBy: { fechaCreacion: "desc" },
    });
    return filas.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      fechaCreacion: p.fechaCreacion,
      totalFormularios: p._count.formularios,
      creador: p.creador.nombre,
    }));
  }

  async buscarPorId(id: string): Promise<Portafolio | null> {
    const p = await prisma.portafolio.findUnique({
      where: { id },
      include: { _count: { select: { formularios: true } } },
    });
    if (!p) return null;
    return new Portafolio(p.nombre, p.descripcion, p.creadorId, p.fechaCreacion, p.id, p._count.formularios);
  }

  async existeNombre(nombre: string, exceptoId?: string): Promise<boolean> {
    const encontrado = await prisma.portafolio.findFirst({
      where: { nombre: { equals: nombre.trim(), mode: "insensitive" }, NOT: exceptoId ? { id: exceptoId } : undefined },
      select: { id: true },
    });
    return encontrado !== null;
  }

  async guardar(p: Portafolio): Promise<string> {
    try {
      if (p.id) {
        await prisma.portafolio.update({ where: { id: p.id }, data: { nombre: p.nombre, descripcion: p.descripcion } });
        return p.id;
      }
      const creado = await prisma.portafolio.create({
        data: { nombre: p.nombre, descripcion: p.descripcion, creadorId: p.creadorId, fechaCreacion: p.fechaCreacion },
      });
      return creado.id;
    } catch (e) {
      if (esViolacionUnica(e)) {
        throw new ErrorDominio({ campo: "nombre", codigo: "errores.portafolio.nombreDuplicado", params: { nombre: p.nombre } });
      }
      throw e;
    }
  }

  async eliminar(id: string): Promise<void> {
    await prisma.portafolio.delete({ where: { id } });
  }
}

export class PrismaRepositorioFormularios implements RepositorioFormularios {
  async listarPorPortafolio(portafolioId: string, estado?: EstadoFormulario): Promise<ResumenFormulario[]> {
    const filas = await prisma.formulario.findMany({
      where: { portafolioId, ...(estado ? { estado } : {}) },
      include: { _count: { select: { preguntas: true, reportes: true } } },
      orderBy: { fechaCreacion: "desc" },
    });
    return filas.map((f) => ({
      id: f.id,
      titulo: f.titulo,
      descripcion: f.descripcion,
      estado: f.estado as EstadoFormulario,
      fechaCreacion: f.fechaCreacion,
      totalPreguntas: f._count.preguntas,
      totalReportes: f._count.reportes,
    }));
  }

  async buscarPorId(id: string): Promise<Formulario | null> {
    const f = await prisma.formulario.findUnique({
      where: { id },
      include: {
        preguntas: { orderBy: { orden: "asc" }, include: { opciones: { orderBy: { orden: "asc" } } } },
        _count: { select: { reportes: true } },
      },
    });
    if (!f) return null;
    const formulario = new Formulario(
      f.titulo,
      f.descripcion,
      f.consentimiento,
      f.portafolioId,
      f.estado as EstadoFormulario,
      f.id,
      f._count.reportes,
      f.fechaCreacion,
    );
    for (const p of f.preguntas) {
      const pregunta = new Pregunta(p.enunciado, p.tipo as TipoPregunta, p.orden, p.obligatoria, p.id);
      p.opciones.forEach((o) => pregunta.agregarOpcion(o.texto, o.id));
      formulario.cargarPregunta(pregunta);
    }
    return formulario;
  }

  async guardar(f: Formulario): Promise<string> {
    const datos = { titulo: f.titulo, descripcion: f.descripcion, consentimiento: f.consentimiento, estado: f.estado };
    if (f.id) {
      await prisma.formulario.update({ where: { id: f.id }, data: datos });
      return f.id;
    }
    const creado = await prisma.formulario.create({ data: { ...datos, portafolioId: f.portafolioId } });
    return creado.id;
  }

  async guardarEstructura(f: Formulario): Promise<void> {
    if (!f.id) throw new Error("El formulario debe existir antes de guardar su estructura");
    const formularioId = f.id;
    await prisma.$transaction(async (tx) => {
      // Protección extra: la estructura solo se modifica si en BD sigue en Borrador.
      const actual = await tx.formulario.findUnique({ where: { id: formularioId }, select: { estado: true } });
      if (!actual || actual.estado !== EstadoFormulario.BORRADOR) {
        throw new ErrorDominio({ codigo: "errores.formulario.estructuraBloqueada" });
      }
      const idsVigentes = f.preguntas.map((p) => p.id).filter((id): id is string => Boolean(id));
      await tx.pregunta.deleteMany({ where: { formularioId, id: { notIn: idsVigentes } } });

      for (const p of f.preguntas) {
        const opciones = p.opciones.map((o) => ({ texto: o.texto, orden: o.orden }));
        const datos = { enunciado: p.enunciado, tipo: p.tipo, orden: p.orden, obligatoria: p.obligatoria };
        if (p.id) {
          await tx.opcion.deleteMany({ where: { preguntaId: p.id } });
          await tx.pregunta.update({ where: { id: p.id }, data: { ...datos, opciones: { create: opciones } } });
        } else {
          await tx.pregunta.create({ data: { ...datos, formularioId, opciones: { create: opciones } } });
        }
      }
    });
  }

  async eliminar(id: string): Promise<void> {
    await prisma.formulario.delete({ where: { id } });
  }
}
