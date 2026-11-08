import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DeliverySettingsForm } from "@/components/app/delivery-settings-form";
import { BackLink } from "@/components/ui/back-link";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getStoreMarkets } from "@/lib/markets/queries";
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

export default async function ShippingSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);
  const markets = await getStoreMarkets(store.id);

  const seen = new Set<string>();
  const options: { code: string; name: string }[] = [];
  for (const market of markets) {
    if (seen.has(market.countryCode)) continue;
    seen.add(market.countryCode);
    options.push({ code: market.countryCode, name: market.countryName });
  }
  if (options.length === 0) {
    options.push({ code: store.country, name: store.country });
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <BackLink href={path(locale, "/app/settings")} label={t.settings.backToApp} />

      <h1 className="mt-5 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        Livraison
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">
        Choisis qui livre {store.name}. Le checkout appliquera ce mode aux
        prochaines commandes.
      </p>

      <div className="mt-8">
        <DeliverySettingsForm
          mode={store.delivery_mode}
          countries={store.delivery_countries}
          options={options}
        />
      </div>
    </div>
  );
}
