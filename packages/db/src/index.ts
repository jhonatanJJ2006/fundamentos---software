import { PrismaClient } from "@prisma/client";

// Singleton: evita abrir múltiples conexiones en desarrollo (hot reload).
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalParaPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = prisma;

export { Prisma } from "@prisma/client";
export type { PrismaClient } from "@prisma/client";
