import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { DocumentLocale } from "@/components/i18n/document-locale";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { directionOf, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getDictionary(locale);

  // Un espace en cours de configuration n'a rien à faire dans un index.
  return {
    title: { default: t.onboarding.storeTitle, template: "%s · Pashove" },
    robots: { index: false, follow: false },
  };
}

export default async function OnboardingLayout({
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
      <OnboardingShell t={t} locale={locale}>
        {children}
      </OnboardingShell>
    </>
  );
}
