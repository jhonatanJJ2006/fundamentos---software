import path from "node:path";
import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

// En local, las variables (DATABASE_URL) se leen del .env en la raíz del monorepo.
loadEnvConfig(path.resolve(__dirname, "../.."));

const nextConfig: NextConfig = {
  transpilePackages: ["@ciudadania/model", "@ciudadania/i18n", "@ciudadania/db"],
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  webpack: (config, { isServer }) => {
    // Copia el motor de Prisma al bundle del servidor (necesario en monorepos desplegados en Vercel).
    if (isServer) config.plugins = [...config.plugins, new PrismaPlugin()];
    return config;
  },
};

export default nextConfig;
