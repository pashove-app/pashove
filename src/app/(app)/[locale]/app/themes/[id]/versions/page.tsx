import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { VersionHistory } from "@/components/theme-editor/versions";
import { resolveLocale } from "@/i18n/config";
import { currentMembership } from "@/lib/stores/queries";
import { getTheme, getThemeVersions } from "@/lib/theme-editor/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function VersionsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale(raw);

  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/onboarding/store`);

  const [theme, versions] = await Promise.all([
    getTheme(membership.store.id, id),
    getThemeVersions(membership.store.id, id),
  ]);

  if (!theme) notFound();

  return (
    <VersionHistory
      themeId={theme.id}
      themeName={theme.name}
      versions={versions}
      locale={locale}
    />
  );
}
