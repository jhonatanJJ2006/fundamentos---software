import { redirect } from "next/navigation";
import { resolverIdioma } from "@/lib/idioma";

export default async function Inicio({ params }: { params: Promise<{ locale: string }> }) {
  const { idioma } = await resolverIdioma(params);
  redirect(`/${idioma}/portafolios`);
}
