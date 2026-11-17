import { NextResponse, type NextRequest } from "next/server";
import { IDIOMAS, IDIOMA_POR_DEFECTO } from "@ciudadania/i18n";

/** Redirige las rutas sin idioma (/portafolios → /es/portafolios) según el navegador. */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const tieneIdioma = IDIOMAS.some((i) => pathname === `/${i}` || pathname.startsWith(`/${i}/`));
  if (tieneIdioma) return NextResponse.next();

  const preferido = req.headers.get("accept-language")?.toLowerCase().startsWith("en") ? "en" : IDIOMA_POR_DEFECTO;
  const url = req.nextUrl.clone();
  url.pathname = `/${preferido}${pathname === "/" ? "/portafolios" : pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|icon.svg|.*\\..*).*)"],
};
