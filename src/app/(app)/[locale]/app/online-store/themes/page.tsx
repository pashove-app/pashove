import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PresetPicker } from "@/components/theme/preset-picker";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getStoreTheme } from "@/lib/theme/queries";
import { currentMembership } from "@/lib/stores/queries";
import Link from "next/link";
import { getStoreAdminCopy } from "@/lib/storefront/admin-copy";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ThemeLibraryPage({
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

  const copy = getStoreAdminCopy(locale);

  return (
    <div>
      <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: `/app/online-store/pages`, title: copy.pages.title, text: "À propos, FAQ, contact" },
          { href: `/app/online-store/navigation`, title: copy.nav.title, text: "Liens de l’en-tête" },
          { href: `/app/online-store/blog`, title: copy.blog.title, text: "Articles et actualités" },
          { href: `/store/${membership.store.slug}/contact`, title: copy.contact.title, text: "Voir la page publique", external: true },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href.startsWith("/app") ? `/${locale}${item.href}` : `/${locale}${item.href}`}
            target={item.external ? "_blank" : undefined}
            className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-brand-500"
          >
            <span className="block text-[0.8125rem] font-medium text-fg">{item.title}</span>
            <span className="mt-1 block text-[0.6875rem] leading-relaxed text-subtle">{item.text}</span>
          </Link>
        ))}
      </div>
      <PresetPicker
      storeId={membership.store.id}
      slug={membership.store.slug}
      locale={locale}
      activePreset={theme.preset}
      labels={t.dashboard.theme}
    />
    </div>
  );
}
