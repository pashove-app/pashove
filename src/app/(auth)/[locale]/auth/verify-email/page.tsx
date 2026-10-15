import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { readPendingEmail } from "@/lib/auth/pending-email";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getDictionary(locale);
  return { title: t.auth.verifyEmailTitle };
}

/**
 * Confirmation d'adresse par code à six chiffres.
 *
 * L'adresse à vérifier vient d'un cookie posé à l'inscription : rien n'est
 * transmis dans l'URL. Si le cookie a expiré, l'écran demande l'adresse avant
 * d'afficher le champ du code.
 */
export default async function VerifyEmailPage({
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

  // Une session ouverte signifie que l'adresse a déjà été confirmée.
  if (user) redirect(`/${locale}/app`);

  const email = await readPendingEmail();
  const t = await getDictionary(locale);

  return <VerifyEmailForm t={t} locale={locale} email={email} />;
}
