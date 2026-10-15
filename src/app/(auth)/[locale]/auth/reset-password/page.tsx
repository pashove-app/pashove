import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getDictionary(locale);
  return { title: t.auth.resetTitle };
}

/**
 * Cette page n'est atteignable qu'après le passage par `/auth/callback`, qui a
 * échangé le jeton du lien contre une session. C'est la présence de cette
 * session qui prouve que le lien était valide.
 */
export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  if (!isSupabaseConfigured()) redirect(`/${locale}/auth/forgot-password`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const t = await getDictionary(locale);

  return <ResetPasswordForm t={t} locale={locale} hasSession={Boolean(user)} />;
}
