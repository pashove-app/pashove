import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PashoveLogo } from "@/components/brand/pashove-logo";
import { DocumentLocale } from "@/components/i18n/document-locale";
import { directionOf, isLocale, resolveLocale } from "@/i18n/config";
import Link from "next/link";

/**
 * Coquille minimale du suivi : pas de navigation marchande, pas de panier.
 * Le client ouvre cette page depuis l'e-mail ou la confirmation de commande.
 */
export default async function TrackingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const locale = resolveLocale(raw);
  const label = locale === "en" ? "Order tracking" : "Suivi de commande";

  return (
    <>
      <DocumentLocale locale={locale} dir={directionOf(locale)} />
      <div className="min-h-dvh bg-bg">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
            <Link href="/" className="flex items-center">
              <PashoveLogo />
            </Link>
            <span className="text-[0.75rem] font-medium text-subtle">
              {label}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </>
  );
}
