import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { clavesDe, en, es, traducir } from "./index";

/** RNF01 — verificación automática de la internacionalización. */

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return nombre === "node_modules" || nombre === ".next" ? [] : archivos(ruta);
    return /\.(ts|tsx)$/.test(nombre) && !nombre.endsWith(".test.ts") ? [ruta] : [];
  });
}

const raiz = resolve(__dirname, "../../..");
const fuentes = [...archivos(join(raiz, "apps/web/src")), ...archivos(join(raiz, "packages/model/src"))];
const codigo = fuentes.map((f) => readFileSync(f, "utf8")).join("\n");

describe("Archivos de recursos es.json / en.json", () => {
  it("tienen exactamente las mismas claves", () => {
    expect(clavesDe(en).sort()).toEqual(clavesDe(es).sort());
  });

  it("ningún texto está vacío", () => {
    for (const clave of clavesDe(es)) {
      expect(traducir("es", clave), clave).not.toBe("");
      expect(traducir("en", clave), clave).not.toBe("");
    }
  });

  it("toda clave literal usada en Vista, Controlador y Modelo existe en ambos idiomas", () => {
    const existentes = new Set(clavesDe(es));
    const usadas = new Set<string>();
    for (const m of codigo.matchAll(/\bt\(\s*"([a-zA-Z.]+)"/g)) usadas.add(m[1]!);
    for (const m of codigo.matchAll(/"(errores\.[a-zA-Z.]+)"/g)) usadas.add(m[1]!);
    for (const m of codigo.matchAll(/\?ok=([a-zA-Z]+)/g)) usadas.add(`exito.${m[1]}`);
    for (const m of codigo.matchAll(/"(formulario(?:Publicado|Cerrado))"/g)) usadas.add(`exito.${m[1]}`);
    const faltantes = [...usadas].filter((c) => !existentes.has(c));
    expect(usadas.size).toBeGreaterThan(50);
    expect(faltantes).toEqual([]);
  });

  it("reemplaza parámetros", () => {
    expect(traducir("es", "portafolio.totalFormularios", { total: 3 })).toBe("Formularios: 3");
    expect(traducir("en", "portafolio.totalFormularios", { total: 3 })).toBe("Forms: 3");
  });
});
