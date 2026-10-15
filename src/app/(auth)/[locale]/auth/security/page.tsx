import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SecurityPanel } from "@/components/auth/security-panel";
import { isLocale, resolveLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { hasVerifiedTotp, requireSecondFactor } from "@/lib/auth/mfa";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getDictionary(locale);
  return { title: t.auth.securityTitle };
}

function formatDateTime(value: string | undefined, locale: Locale): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Paramètres de sécurité du compte : mot de passe, adresse, sessions, sortie.
 *
 * Toutes les opérations d'ici sont sensibles — c'est le seul écran d'où l'on
 * peut s'emparer durablement d'un compte — d'où l'exigence du second facteur
 * quand il est actif, et la revérification du mot de passe avant de le changer.
 */
export default async function SecurityPage({
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

  const t = await getDictionary(locale);

  return (
    <SecurityPanel
      t={t}
      locale={locale}
      email={user.email ?? "—"}
      lastSignIn={formatDateTime(user.last_sign_in_at, locale)}
      twoFactorOn={hasVerifiedTotp(user)}
    />
  );
}
