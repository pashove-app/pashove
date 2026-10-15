import type { Metadata } from "next";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { readPendingEmail } from "@/lib/auth/pending-email";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getDictionary(locale);
  return { title: t.auth.resendTitle };
}

/** Renvoi du code de confirmation, avec l'adresse pré-remplie si on la connaît. */
export default async function ResendVerificationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const email = await readPendingEmail();
  const t = await getDictionary(locale);

  return <ResendVerificationForm t={t} locale={locale} email={email} />;
}
