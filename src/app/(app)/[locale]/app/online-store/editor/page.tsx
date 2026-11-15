import { redirect } from "next/navigation";
import { resolveLocale } from "@/i18n/config";
import { currentMembership } from "@/lib/stores/queries";
import { loadEditorData } from "@/lib/theme-editor/queries";

/** Ancien éditeur : on ouvre le premier thème dans le nouveau constructeur. */
export default async function LegacyEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/onboarding/store`);

  const data = await loadEditorData(membership.store.id);
  const theme = data.themes[0];
  if (!theme) redirect(`/${locale}/app/themes`);

  redirect(`/${locale}/app/themes/${theme.id}/editor`);
}
