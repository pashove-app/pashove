import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NavEditor } from "@/components/app/nav-editor";
import { resolveLocale } from "@/i18n/config";
import { getStoreAdminCopy } from "@/lib/storefront/admin-copy";
import { listNavItems } from "@/lib/storefront/navigation";
import { currentMembership } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  return { title: getStoreAdminCopy(resolveLocale(raw)).nav.title };
}

export default async function NavigationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/onboarding/store`);

  const items = await listNavItems(membership.store.id);
  const copy = getStoreAdminCopy(locale);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {copy.nav.title}
      </h1>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
        {copy.nav.subtitle}
      </p>

      <NavEditor locale={locale} initialItems={items} labels={copy.nav} />
    </div>
  );
}
