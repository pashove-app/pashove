import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { DocumentLocale } from "@/components/i18n/document-locale";
import { directionOf, isLocale } from "@/i18n/config";

export const metadata: Metadata = {
  title: { default: "Pashove", template: "%s · Pashove" },
  // Une vitrine est faite pour être trouvée ; chaque page précise son titre.
  robots: { index: true, follow: true },
};

/**
 * Coquille de la vitrine publique.
 *
 * Pas d'en-tête marchand, pas de sélecteur de langue : le visiteur ne voit que
 * la boutique. Le sens de lecture est posé par `DocumentLocale` comme ailleurs.
 */
export default async function StorefrontLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <>
      <DocumentLocale locale={locale} dir={directionOf(locale)} />
      {children}
    </>
  );
}
