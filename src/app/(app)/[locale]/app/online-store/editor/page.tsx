import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ThemeEditor } from "@/components/theme/theme-editor";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getStoreTheme } from "@/lib/theme/queries";
import { currentMembership } from "@/lib/stores/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ThemeEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/onboarding/store`);

  const [theme, t] = await Promise.all([
    getStoreTheme(membership.store.id),
    getDictionary(locale),
  ]);

  return (
    <ThemeEditor
      storeId={membership.store.id}
      slug={membership.store.slug}
      locale={locale}
      initialTheme={theme}
      labels={t.dashboard.theme}
    />
  );
}
