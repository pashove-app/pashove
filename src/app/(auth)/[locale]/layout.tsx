import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { DocumentLocale } from "@/components/i18n/document-locale";
import { directionOf, isLocale, LOCALES, LOCALE_META } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getDictionary(locale);

  return {
    title: { default: t.meta.ogTitle, template: "%s · Pashove" },
    description: t.meta.description,
    // Les écrans de connexion et d'inscription n'ont rien à faire dans un index.
    robots: { index: false, follow: false },
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((code) => [LOCALE_META[code].tag, `/${code}/auth/login`]),
      ),
    },
  };
}

export default async function AuthLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = await getDictionary(locale);

  return (
    <>
      <DocumentLocale locale={locale} dir={directionOf(locale)} />
      <AuthShell t={t} locale={locale}>
        {children}
      </AuthShell>
    </>
  );
}
