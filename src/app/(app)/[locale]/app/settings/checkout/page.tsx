import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutSettingsForm } from "@/components/app/checkout-settings-form";
import { BackLink } from "@/components/ui/back-link";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getStoreCheckoutSettings } from "@/lib/checkout/queries";
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

export default async function CheckoutSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);
  const settings = await getStoreCheckoutSettings(store.id);

  // Valeurs par défaut de la langue, affichées en indication des champs.
  const defaults = {
    title: t.storefront.checkoutPageTitle,
    subtitle: t.storefront.checkoutPageSubtitle,
    payLabel: t.storefront.checkoutConfirm,
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <BackLink href={path(locale, "/app/settings")} label={t.settings.backToApp} />

      <h1 className="mt-5 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        Page de paiement
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">
        Personnalise l’apparence du checkout de {store.name}. Les couleurs, la
        police et le logo viennent déjà de ton thème de vitrine.
      </p>

      <div className="mt-8">
        <CheckoutSettingsForm
          locale={locale}
          settings={settings}
          defaults={defaults}
        />
      </div>
    </div>
  );
}
