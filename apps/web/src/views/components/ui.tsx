import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import type { Traductor } from "@ciudadania/i18n";
import type { MensajeVista } from "@/controllers/tipos";

/* Componentes de presentación reutilizables (sin textos fijos: reciben todo por props). */

export function cx(...clases: (string | false | null | undefined)[]) {
  return clases.filter(Boolean).join(" ");
}

const estilosBoton = {
  primario: "bg-primario text-white hover:bg-primario-oscuro focus-visible:outline-primario",
  secundario: "bg-white text-tinta ring-1 ring-borde hover:bg-fondo focus-visible:outline-primario",
  peligro: "bg-white text-peligro ring-1 ring-peligro/40 hover:bg-peligro/5 focus-visible:outline-peligro",
  fantasma: "text-primario hover:bg-primario/10 focus-visible:outline-primario",
} as const;
export type VarianteBoton = keyof typeof estilosBoton;

const baseBoton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export function Boton({ variante = "primario", className, ...props }: ComponentProps<"button"> & { variante?: VarianteBoton }) {
  return <button className={cx(baseBoton, estilosBoton[variante], className)} {...props} />;
}

export function EnlaceBoton({ variante = "primario", className, ...props }: ComponentProps<typeof Link> & { variante?: VarianteBoton }) {
  return <Link className={cx(baseBoton, estilosBoton[variante], className)} {...props} />;
}

export function Tarjeta({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-xl bg-white p-4 shadow-sm ring-1 ring-borde sm:p-6", className)}>{children}</div>;
}

export function Alerta({ tipo, children }: { tipo: "exito" | "error" | "info"; children: ReactNode }) {
  const estilos = {
    exito: "bg-exito/10 text-exito ring-exito/30",
    error: "bg-peligro/10 text-peligro ring-peligro/30",
    info: "bg-primario/10 text-primario-oscuro ring-primario/30",
  }[tipo];
  return (
    <div role={tipo === "error" ? "alert" : "status"} className={cx("rounded-lg px-4 py-3 text-sm font-medium ring-1", estilos)}>
      {children}
    </div>
  );
}

export function ErroresCampo({ id, mensajes, t }: { id: string; mensajes?: MensajeVista[]; t: Traductor }) {
  if (!mensajes?.length) return null;
  return (
    <ul id={id} className="mt-1 space-y-0.5 text-sm text-peligro">
      {mensajes.map((m) => (
        <li key={m.codigo}>{t(m.codigo, m.params)}</li>
      ))}
    </ul>
  );
}

export const claseInput =
  "block w-full rounded-lg border-0 bg-white px-3 py-2 text-base text-tinta ring-1 ring-borde placeholder:text-tenue " +
  "focus:ring-2 focus:ring-primario aria-[invalid=true]:ring-peligro sm:text-sm";

export function Etiqueta({ htmlFor, children, obligatorio }: { htmlFor: string; children: ReactNode; obligatorio?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold text-tinta">
      {children}
      {obligatorio && <span className="ml-0.5 text-peligro" aria-hidden="true">*</span>}
    </label>
  );
}

export function TituloPagina({ titulo, subtitulo, acciones }: { titulo: string; subtitulo?: string; acciones?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-tinta break-words sm:text-3xl">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-tenue break-words">{subtitulo}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

export function Migas({ items, etiqueta }: { items: { texto: string; href?: string }[]; etiqueta: string }) {
  return (
    <nav aria-label={etiqueta} className="mb-4 text-sm text-tenue">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex min-w-0 items-center gap-1">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className="truncate hover:text-primario hover:underline">
                {item.texto}
              </Link>
            ) : (
              <span className="truncate font-medium text-tinta">{item.texto}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EtiquetaEstado({ estado, t }: { estado: string; t: Traductor }) {
  const estilos: Record<string, string> = {
    BORRADOR: "bg-aviso/15 text-aviso-oscuro ring-aviso/40",
    PUBLICADO: "bg-exito/10 text-exito ring-exito/30",
    CERRADO: "bg-tenue/10 text-tenue ring-tenue/30",
  };
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1", estilos[estado])}>
      {t(`estados.${estado}`)}
    </span>
  );
}

export function Vacio({ titulo, texto, accion }: { titulo: string; texto?: string; accion?: ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-borde bg-white/60 px-6 py-10 text-center">
      <p className="font-semibold text-tinta">{titulo}</p>
      {texto && <p className="mt-1 text-sm text-tenue">{texto}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );
}
