import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StoreForm } from "@/components/onboarding/store-form";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary, interpolate } from "@/i18n/get-dictionary";
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

  // La boutique existante est éditable : c'est ce que trouve le bouton
  // « Retour » de l'étape 2. Pas de redirection, donc, mais un mode édition.
  const store = await currentStore();

  const t = await getDictionary(locale);

  return (
    <StoreForm
      t={t}
      locale={locale}
      store={store}
      // Interpolé côté serveur : le composant client n'a pas à embarquer le
      // chargeur de dictionnaires pour un simple remplacement de jetons.
      stepLabel={interpolate(t.onboarding.stepProgress, { current: 1, total: 4 })}
    />
  );
}
