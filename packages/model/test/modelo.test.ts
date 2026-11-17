import { describe, expect, it } from "vitest";
import { EstadoFormulario, Rol, TipoPregunta } from "../src/domain/enums";
import { ErrorDominio } from "../src/domain/errores";
import { Formulario } from "../src/domain/Formulario";
import { Portafolio } from "../src/domain/Portafolio";
import { Pregunta } from "../src/domain/Pregunta";
import { Usuario } from "../src/domain/Usuario";
import { FormularioService, PortafolioService, PreguntaService } from "../src/services/servicios";
import { RepoFormulariosMemoria, RepoPortafoliosMemoria } from "./enMemoria";

const investigador = new Usuario("u1", "Ana Investigadora", "ana@utpl.edu.ec", Rol.INVESTIGADOR);
const datosFormulario = { titulo: "Baches", descripcion: "Reporte de baches", consentimiento: "Acepto" };

function codigos(fn: () => unknown): string[] {
  try {
    fn();
  } catch (e) {
    if (e instanceof ErrorDominio) return e.detalles.map((d) => d.codigo);
    throw e;
  }
  return [];
}

async function codigosAsync(fn: () => Promise<unknown>): Promise<string[]> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof ErrorDominio) return e.detalles.map((d) => d.codigo);
    throw e;
  }
  return [];
}

function crearEntorno() {
  const formularios = new RepoFormulariosMemoria();
  const portafolios = new RepoPortafoliosMemoria(formularios);
  return {
    portafolios: new PortafolioService(portafolios),
    formularios: new FormularioService(formularios, portafolios),
    preguntas: new PreguntaService(formularios),
    repoFormularios: formularios,
  };
}

describe("Usuario", () => {
  it("solo el Investigador puede gestionar formularios (RNF02)", () => {
    expect(investigador.esInvestigador()).toBe(true);
    expect(new Usuario("u2", "Pedro", "p@x.ec", Rol.PARTICIPANTE).esInvestigador()).toBe(false);
  });
});

describe("Portafolio (RF01–RF04)", () => {
  it("RNF03 caso 1: un portafolio sin nombre no se guarda", async () => {
    const { portafolios } = crearEntorno();
    expect(await codigosAsync(() => portafolios.registrar({ nombre: "  " }, investigador))).toContain(
      "errores.portafolio.nombreObligatorio",
    );
    expect(await portafolios.listar()).toHaveLength(0);
  });

  it("asigna la fecha de creación automáticamente", () => {
    const p = Portafolio.crear({ nombre: "Movilidad segura" }, "u1");
    expect(p.fechaCreacion).toBeInstanceOf(Date);
  });

  it("el nombre es único al registrar y al modificar (sin distinguir mayúsculas)", async () => {
    const { portafolios } = crearEntorno();
    await portafolios.registrar({ nombre: "Movilidad segura" }, investigador);
    const otro = await portafolios.registrar({ nombre: "Ambiente" }, investigador);
    expect(await codigosAsync(() => portafolios.registrar({ nombre: "movilidad SEGURA" }, investigador))).toContain(
      "errores.portafolio.nombreDuplicado",
    );
    expect(await codigosAsync(() => portafolios.modificar(otro, { nombre: "Movilidad segura" }))).toContain(
      "errores.portafolio.nombreDuplicado",
    );
    // Mantener su propio nombre sí es válido
    await portafolios.modificar(otro, { nombre: "Ambiente", descripcion: "Residuos" });
  });

  it("busca por nombre y cuenta formularios", async () => {
    const { portafolios, formularios } = crearEntorno();
    const id = await portafolios.registrar({ nombre: "Movilidad segura" }, investigador);
    await portafolios.registrar({ nombre: "Ambiente y residuos" }, investigador);
    await formularios.registrar(id, datosFormulario);
    const resultado = await portafolios.listar("movil");
    expect(resultado).toHaveLength(1);
    expect(resultado[0]!.totalFormularios).toBe(1);
  });

  it("solo se elimina si no contiene formularios", async () => {
    const { portafolios, formularios } = crearEntorno();
    const id = await portafolios.registrar({ nombre: "Movilidad segura" }, investigador);
    const fId = await formularios.registrar(id, datosFormulario);
    expect(await codigosAsync(() => portafolios.eliminar(id))).toContain("errores.portafolio.tieneFormularios");
    await formularios.eliminar(fId);
    await portafolios.eliminar(id);
    expect(await portafolios.listar()).toHaveLength(0);
  });
});

describe("Formulario (RF05–RF09)", () => {
  it("nace en Borrador y exige título, descripción y consentimiento", () => {
    const f = Formulario.crear({ titulo: "", descripcion: "", consentimiento: "" }, "p1");
    expect(f.estado).toBe(EstadoFormulario.BORRADOR);
    expect(codigos(() => f.validar().lanzarSiHayErrores())).toEqual([
      "errores.formulario.tituloObligatorio",
      "errores.formulario.descripcionObligatoria",
      "errores.formulario.consentimientoObligatorio",
    ]);
  });

  it("RNF03 caso 3: no se publica sin preguntas", () => {
    const f = Formulario.crear(datosFormulario, "p1");
    expect(codigos(() => f.publicar())).toContain("errores.formulario.publicarSinPreguntas");
    expect(f.estado).toBe(EstadoFormulario.BORRADOR);
  });

  it("Borrador → Publicado → Cerrado; nunca vuelve a Borrador", () => {
    const f = Formulario.crear(datosFormulario, "p1");
    f.agregarPregunta({ enunciado: "¿Qué observa?", tipo: TipoPregunta.TEXTO, obligatoria: true });
    expect(codigos(() => f.cerrar())).toContain("errores.formulario.transicionInvalida");
    f.publicar();
    expect(f.estado).toBe(EstadoFormulario.PUBLICADO);
    expect(codigos(() => f.cambiarEstado(EstadoFormulario.BORRADOR))).toContain("errores.formulario.transicionInvalida");
    f.cerrar();
    expect(f.estado).toBe(EstadoFormulario.CERRADO);
    expect(codigos(() => f.cambiarEstado(EstadoFormulario.BORRADOR))).toContain("errores.formulario.transicionInvalida");
  });

  it("un formulario Publicado o Cerrado no permite modificar preguntas", () => {
    const f = Formulario.crear(datosFormulario, "p1");
    f.agregarPregunta({ enunciado: "¿Qué observa?", tipo: TipoPregunta.TEXTO, obligatoria: true });
    f.publicar();
    expect(f.esEditable()).toBe(false);
    expect(codigos(() => f.agregarPregunta({ enunciado: "Otra", tipo: TipoPregunta.TEXTO, obligatoria: false }))).toContain(
      "errores.formulario.estructuraBloqueada",
    );
  });

  it("RF08: en Borrador se elimina; con reportes se cierra; Publicado sin reportes no se elimina", async () => {
    const { portafolios, formularios, repoFormularios } = crearEntorno();
    const pId = await portafolios.registrar({ nombre: "Movilidad" }, investigador);

    const borrador = await formularios.registrar(pId, datosFormulario);
    expect(await formularios.eliminar(borrador)).toBe("ELIMINADO");

    const conReportes = await formularios.registrar(pId, datosFormulario);
    repoFormularios.filas.get(conReportes)!.reportes = 3;
    repoFormularios.filas.get(conReportes)!.estado = EstadoFormulario.PUBLICADO;
    expect(await formularios.eliminar(conReportes)).toBe("CERRADO");
    expect((await formularios.obtener(conReportes)).estado).toBe(EstadoFormulario.CERRADO);

    const publicado = await formularios.registrar(pId, datosFormulario);
    repoFormularios.filas.get(publicado)!.estado = EstadoFormulario.PUBLICADO;
    expect(await codigosAsync(() => formularios.eliminar(publicado))).toContain("errores.formulario.soloBorradorSeElimina");
  });

  it("RF06: filtra por estado", async () => {
    const { portafolios, formularios, repoFormularios } = crearEntorno();
    const pId = await portafolios.registrar({ nombre: "Movilidad" }, investigador);
    await formularios.registrar(pId, datosFormulario);
    const pub = await formularios.registrar(pId, datosFormulario);
    repoFormularios.filas.get(pub)!.estado = EstadoFormulario.PUBLICADO;
    expect(await formularios.listar(pId, "PUBLICADO")).toHaveLength(1);
    expect(await formularios.listar(pId)).toHaveLength(2);
  });
});

describe("Pregunta (RF10–RF12)", () => {
  it("RNF03 caso 2: opción múltiple con 1 opción no se guarda", () => {
    const p = Pregunta.crear({ enunciado: "Tipo de problema", tipo: TipoPregunta.OPCION_MULTIPLE, obligatoria: true, opciones: ["bache"] });
    expect(codigos(() => p.validar().lanzarSiHayErrores())).toContain("errores.pregunta.minimoOpciones");
  });

  it("valida opciones vacías y duplicadas", () => {
    const p = Pregunta.crear({ enunciado: "Tipo", tipo: TipoPregunta.OPCION_MULTIPLE, obligatoria: true, opciones: ["bache", "", "Bache"] });
    const errores = codigos(() => p.validar().lanzarSiHayErrores());
    expect(errores).toContain("errores.opcion.textoObligatorio");
    expect(errores).toContain("errores.opcion.duplicada");
  });

  it("las preguntas que no son de opción múltiple descartan las opciones", () => {
    const p = Pregunta.crear({ enunciado: "Ubicación", tipo: TipoPregunta.UBICACION_GPS, obligatoria: true, opciones: ["x"] });
    p.validar().lanzarSiHayErrores();
    expect(p.opciones).toHaveLength(0);
  });

  it("agrega en la posición indicada, modifica el orden y reordena al eliminar", async () => {
    const { portafolios, formularios, preguntas } = crearEntorno();
    const pId = await portafolios.registrar({ nombre: "Movilidad" }, investigador);
    const fId = await formularios.registrar(pId, datosFormulario);
    await preguntas.agregar(fId, { enunciado: "A", tipo: TipoPregunta.TEXTO, obligatoria: false });
    await preguntas.agregar(fId, { enunciado: "B", tipo: TipoPregunta.SI_NO, obligatoria: false });
    await preguntas.agregar(fId, { enunciado: "C", tipo: TipoPregunta.IMAGEN, obligatoria: false, orden: 1 });
    let f = await formularios.obtener(fId);
    expect(f.preguntas.map((p) => `${p.orden}${p.enunciado}`)).toEqual(["1C", "2A", "3B"]);

    const idA = f.preguntas[1]!.id!;
    await preguntas.modificar(fId, idA, {
      enunciado: "A2", tipo: TipoPregunta.OPCION_MULTIPLE, obligatoria: true, orden: 3, opciones: ["bache", "basura"],
    });
    f = await formularios.obtener(fId);
    expect(f.preguntas.map((p) => `${p.orden}${p.enunciado}`)).toEqual(["1C", "2B", "3A2"]);
    expect(f.preguntas[2]!.opciones.map((o) => o.texto)).toEqual(["bache", "basura"]);

    await preguntas.eliminar(fId, f.preguntas[0]!.id!);
    f = await formularios.obtener(fId);
    expect(f.preguntas.map((p) => `${p.orden}${p.enunciado}`)).toEqual(["1B", "2A2"]);
  });
});
