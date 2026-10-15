import type { Metadata } from "next";
import { RecoveryCodeForm } from "@/components/auth/recovery-code-form";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { verifiedTotpId } from "@/lib/auth/mfa";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getDictionary(locale);
  return { title: t.auth.recoveryChallengeTitle };
}

/**
 * Seconde étape de la connexion, par code de secours.
 *
 * Réservée aux comptes qui ont réellement un second facteur actif : sans lui,
 * il n'y a rien à contourner.
 */
export default async function RecoveryCodePage({
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
  if (!verifiedTotpId(factors?.all)) redirect(`/${locale}/app`);

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel === "aal2") redirect(`/${locale}/app`);

  const t = await getDictionary(locale);

  return <RecoveryCodeForm t={t} locale={locale} />;
}
