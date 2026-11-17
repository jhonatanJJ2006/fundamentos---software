import type { Traductor } from "@ciudadania/i18n";
import { Alerta } from "./ui";

/** Muestra el mensaje de éxito que el Controlador envía tras redirigir (parámetro ok de la URL). */
export function MensajeExito({ ok, t }: { ok?: string | string[]; t: Traductor }) {
  if (typeof ok !== "string" || !/^[a-zA-Z]+$/.test(ok)) return null;
  return (
    <div className="mb-6">
      <Alerta tipo="exito">{t(`exito.${ok}`)}</Alerta>
    </div>
  );
}
