import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { IDIOMAS, traducir, esIdioma, IDIOMA_POR_DEFECTO } from "@ciudadania/i18n";
import { resolverIdioma } from "@/lib/idioma";
import { Encabezado } from "@/views/components/Encabezado";
import "../globals.css";

export function generateStaticParams() {
  return IDIOMAS.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const idioma = esIdioma(locale) ? locale : IDIOMA_POR_DEFECTO;
  return {
    title: { default: traducir(idioma, "app.nombre"), template: `%s · ${traducir(idioma, "app.nombre")}` },
    description: traducir(idioma, "app.descripcion"),
  };
}

// Todas las vistas leen datos vivos de la BD y la sesión simulada.
export const dynamic = "force-dynamic";

// RNF04: diseño adaptable desde 360 px.
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function LayoutIdioma({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { idioma, t } = await resolverIdioma(params);
  return (
    <html lang={idioma}>
      <body className="min-h-dvh font-sans antialiased">
        <Encabezado idioma={idioma} />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-xs text-tenue">{t("app.pie")}</footer>
      </body>
    </html>
  );
}
