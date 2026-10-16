import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StoreForm } from "@/components/onboarding/store-form";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireSecondFactor } from "@/lib/auth/mfa";
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
  return { title: t.onboarding.storeTitle };
}

/**
 * Première étape de l'onboarding : l'identité de la boutique.
 *
 * La reprise après interruption ne repose sur aucun compteur d'étapes : elle se
 * déduit de ce qui existe réellement en base. Un marchand qui a déjà une
 * boutique n'a rien à faire ici, et y revenir le renvoie à son espace.
 */
export default async function OnboardingStorePage({
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

  // On ne construit pas une boutique derrière un simple mot de passe.
  await requireSecondFactor(locale, user);

  if (await currentStore()) redirect(`/${locale}/app`);

  const t = await getDictionary(locale);

  return (
    <StoreForm
      t={t}
      locale={locale}
      // Le nom saisi à l'inscription sert de point de départ : le marchand l'a
      // déjà écrit une fois, on ne le lui demande pas deux fois.
      defaultName={(user.user_metadata?.store_name as string | undefined) ?? ""}
      defaultCountry={(user.user_metadata?.country as string | undefined) ?? ""}
    />
  );
}
