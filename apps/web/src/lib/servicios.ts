import "server-only";
import { crearServicios, type Servicios } from "@ciudadania/model";

// Una sola instancia de los servicios del Modelo por proceso del servidor.
const global = globalThis as unknown as { servicios?: Servicios };
export const servicios: Servicios = global.servicios ?? (global.servicios = crearServicios());
