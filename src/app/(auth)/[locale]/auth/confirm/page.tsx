import type { Metadata } from "next";
import { ConfirmEmailForm } from "@/components/auth/confirm-email-form";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/**
 * Écran d'interstitiel des liens reçus par e-mail.
 *
 * Le lien ne fait que nous amener ici : rien n'est consommé au chargement, la
 * vérification du jeton passe par le bouton. C'est ce qui met l'adresse à l'abri
 * des pré-visites des messageries, qui ouvrent les liens pour les analyser et
 * consommeraient sinon le jeton avant l'utilisateur.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getDictionary(locale);
  return { title: t.auth.confirmSignupTitle };
}

function readIntent(value: string | string[] | undefined): "signup" | "recovery" | "invalid" {
  // `email` et `signup` désignent la confirmation d'inscription selon la façon
  // dont le gabarit a été écrit : on accepte les deux.
  if (value === "recovery") return "recovery";
  if (value === "signup" || value === "email") return "signup";
  return "invalid";
}

export default async function ConfirmEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const query = await searchParams;
  const rawToken = query.token_hash;
  const tokenHash = typeof rawToken === "string" && rawToken.length > 0 ? rawToken : null;

  const t = await getDictionary(locale);

  return (
    <ConfirmEmailForm
      t={t}
      locale={locale}
      tokenHash={tokenHash}
      intent={tokenHash ? readIntent(query.type) : "invalid"}
    />
  );
}
