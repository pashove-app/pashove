import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TotpChallengeForm } from "@/components/auth/totp-challenge-form";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { verifiedTotpId } from "@/lib/auth/mfa";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getDictionary(locale);
  return { title: t.auth.totpChallengeTitle };
}

/**
 * Deuxième étape de la connexion.
 *
 * C'est ici qu'aboutit un utilisateur dont le mot de passe a été accepté mais
 * dont la session n'est encore qu'au premier niveau d'assurance.
 */
export default async function TotpChallengePage({
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

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factorId = verifiedTotpId(factors?.all);

  // Aucun second facteur : rien à demander.
  if (!factorId) redirect(`/${locale}/app`);

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  // Déjà satisfait : on ne redemande pas un code.
  if (assurance?.currentLevel === "aal2") redirect(`/${locale}/app`);

  const t = await getDictionary(locale);

  return <TotpChallengeForm t={t} locale={locale} factorId={factorId} />;
}
