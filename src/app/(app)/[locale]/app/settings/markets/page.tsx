import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MarketsForm } from "@/components/app/markets-form";
import { BackLink } from "@/components/ui/back-link";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getPlatformMarkets, getStoreMarkets } from "@/lib/markets/queries";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.settings.title };
}

export default async function MarketsSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);
  const [platform, active] = await Promise.all([
    getPlatformMarkets(),
    getStoreMarkets(store.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <BackLink href={path(locale, "/app/settings")} label={t.settings.backToApp} />

      <h1 className="mt-5 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        Pays de vente
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">
        Choisis les pays où {store.name} accepte des commandes. Les moyens de
        paiement de chaque pays sont fournis par Pashove et ne se modifient pas.
      </p>

      <div className="mt-8">
        <MarketsForm
          locale={locale}
          markets={platform}
          selected={active.map((market) => market.code)}
          storeCurrency={store.currency}
          codEnabled={store.cod_enabled}
        />
      </div>
    </div>
  );
}
