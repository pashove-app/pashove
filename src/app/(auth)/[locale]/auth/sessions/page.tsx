import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SessionsPanel } from "@/components/auth/sessions-panel";
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
  return { title: t.auth.sessionsTitle };
}

/** Mise en forme faite côté serveur, transmise en texte : pas de décalage à l'hydratation. */
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
 * Sessions et appareils.
 *
 * Supabase n'expose pas la liste des sessions d'un utilisateur sans les droits
 * d'administration. L'écran montre donc ce qu'il sait vraiment — la session en
 * cours — et propose les deux gestes utiles, plutôt que d'afficher une liste
 * d'appareils qu'il faudrait inventer.
 */
export default async function SessionsPage({
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

  // Fermer des sessions est un geste de sécurité : il exige d'avoir franchi le
  // second facteur quand il est actif, comme la page de configuration 2FA.
  await requireSecondFactor(locale, user);

  const t = await getDictionary(locale);

  return (
    <SessionsPanel
      t={t}
      locale={locale}
      email={user.email ?? "—"}
      lastSignIn={formatDateTime(user.last_sign_in_at, locale)}
      twoFactorOn={hasVerifiedTotp(user)}
    />
  );
}
