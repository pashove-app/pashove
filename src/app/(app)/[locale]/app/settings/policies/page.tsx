import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StorePoliciesForm } from "@/components/app/store-policies-form";
import { BackLink } from "@/components/ui/back-link";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getStorePolicies } from "@/lib/policies/queries";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.policies.title };
}

export default async function StorePoliciesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const [policies, t] = await Promise.all([
    getStorePolicies(store.id),
    getDictionary(locale),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink
        href={path(locale, "/app/settings")}
        label={t.policies.backToSettings}
      />

      <div className="mt-5">
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {t.policies.title}
        </h1>
        <p className="mt-1.5 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
          {t.policies.subtitle}
        </p>
      </div>

      <StorePoliciesForm
        t={t}
        locale={locale}
        identity={policies.identity}
        pages={policies.pages}
        storeCountry={store.country}
      />
    </div>
  );
}
