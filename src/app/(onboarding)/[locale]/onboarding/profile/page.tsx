import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/onboarding/profile-form";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary, interpolate } from "@/i18n/get-dictionary";
import { requireSecondFactor } from "@/lib/auth/mfa";
import { currentOnboardingStep } from "@/lib/onboarding/steps";
import { readProfile } from "@/lib/profile/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getDictionary(locale);
  return { title: t.onboarding.profileTitle };
}

/**
 * Deuxième étape : le profil du marchand.
 *
 * L'ordre des étapes n'est pas mémorisé, il est déduit de la base : une
 * boutique sans profil valide renvoie ici, un profil complet renvoie à l'espace
 * marchand.
 */
export default async function OnboardingProfilePage({
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
  if (step === "done") redirect(`/${locale}/app`);

  const profile = await readProfile();
  if (!profile) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);

  return (
    <ProfileForm
      t={t}
      locale={locale}
      profile={profile}
      stepLabel={interpolate(t.onboarding.stepProgress, { current: 2, total: 4 })}
    />
  );
}
