import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ThemeLibrary } from "@/components/theme-editor/library";
import { resolveLocale } from "@/i18n/config";
import { currentMembership } from "@/lib/stores/queries";
import { loadEditorData } from "@/lib/theme-editor/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ThemesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/onboarding/store`);

  const data = await loadEditorData(membership.store.id);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <ThemeLibrary
        themes={data.themes}
        locale={locale}
        storeName={membership.store.name}
      />
    </div>
  );
}
