import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LaunchForm } from "@/components/onboarding/launch-form";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary, interpolate } from "@/i18n/get-dictionary";
import { requireSecondFactor } from "@/lib/auth/mfa";
import { currentOnboardingStep } from "@/lib/onboarding/steps";
import { readProfile } from "@/lib/profile/queries";
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
  return { title: t.onboarding.launchTitle };
}

/**
 * Quatrième étape : récapitulatif et publication.
 *
 * Elle n'est atteignable que lorsque les trois premières étapes sont
 * satisfaites ; une boutique déjà publiée renvoie à l'espace marchand.
 */
export default async function OnboardingLaunchPage({
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
  if (step === "selling") redirect(`/${locale}/onboarding/selling`);
  if (step === "done") redirect(`/${locale}/app`);

  const store = await currentStore();
  const profile = await readProfile();
  if (!store || !profile) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);

  return (
    <LaunchForm
      t={t}
      locale={locale}
      store={store}
      profile={profile}
      stepLabel={interpolate(t.onboarding.stepProgress, { current: 4, total: 4 })}
    />
  );
}
