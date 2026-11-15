import { redirect } from "next/navigation";
import { resolveLocale } from "@/i18n/config";

/** Ancienne bibliothèque de thèmes : l’éditeur complet vit sous /app/themes. */
export default async function LegacyThemesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  redirect(`/${resolveLocale(raw)}/app/themes`);
}
