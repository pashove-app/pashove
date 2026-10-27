import type { ReactNode } from "react";
import { NewsletterForm } from "@/components/marketing/newsletter";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicHeader } from "@/components/marketing/public-header";
import { resolveLocale } from "@/i18n/config";
import { getSiteContent } from "@/lib/marketing/content";

/** Coquille du site public Pashove, indépendante du thème de la vitrine. */
export default async function PublicSiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const content = getSiteContent(locale);

  return (
    <div
      className="font-body min-h-dvh overflow-x-clip bg-[#04060D] text-white selection:bg-brand-500/35 selection:text-white"
      style={{ colorScheme: "dark" }}
    >
      <PublicHeader locale={locale} content={content} />
      <main>{children}</main>
      <NewsletterForm content={content.newsletter} />
      <PublicFooter locale={locale} content={content} />
    </div>
  );
}
