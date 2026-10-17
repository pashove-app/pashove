import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SellingForm } from "@/components/onboarding/selling-form";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary, interpolate } from "@/i18n/get-dictionary";
import { requireSecondFactor } from "@/lib/auth/mfa";
import { currentOnboardingStep } from "@/lib/onboarding/steps";
import { currentStore } from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getDictionary(locale);
  return { title: t.onboarding.sellingTitle };
}

/**
 * Troisième étape : ce que la boutique vend.
 *
 * Reste accessible une fois l'onboarding terminé : c'est aussi ici qu'un
 * marchand ajoutera un type de vente oublié.
 */
export default async function OnboardingSellingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  if (!isSupabaseConfigured()) redirect(`/${locale}/auth/login`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  await requireSecondFactor(locale, user);

  const step = await currentOnboardingStep();
  if (step === "store") redirect(`/${locale}/onboarding/store`);
  if (step === "profile") redirect(`/${locale}/onboarding/profile`);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);

  return (
    <SellingForm
      t={t}
      locale={locale}
      productTypes={store.product_types}
      stepLabel={interpolate(t.onboarding.stepProgress, { current: 3, total: 4 })}
    />
  );
}
