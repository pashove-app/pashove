import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TotpSetupForm } from "@/components/auth/totp-setup-form";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireSecondFactor, verifiedTotpId } from "@/lib/auth/mfa";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getDictionary(locale);
  return { title: t.auth.totpSetupTitle };
}

/**
 * Configuration du second facteur. Réservée à une session ouverte : on ne
 * propose pas d'enrôler une 2FA sur un compte auquel on n'est pas connecté.
 */
export default async function TotpSetupPage({
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

  // Modifier la 2FA exige de l'avoir franchie : Supabase refuse d'ailleurs de
  // retirer un facteur confirmé sur une session restée au premier niveau
  // (`insufficient_aal`). Un mot de passe volé ne doit pas pouvoir la retirer.
  await requireSecondFactor(locale, user);

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const t = await getDictionary(locale);

  return (
    <TotpSetupForm
      t={t}
      locale={locale}
      verifiedFactorId={verifiedTotpId(factors?.all)}
    />
  );
}
