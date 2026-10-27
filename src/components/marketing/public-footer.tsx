import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { SiteContent } from "@/lib/marketing/content";
import { MarketingContainer, MarketingLogo, publicHref } from "@/components/marketing/ui";

export function PublicFooter({
  locale,
  content,
}: {
  locale: Locale;
  content: SiteContent;
}) {
  const footer = content.footer;

  const columns = [
    { title: footer.productTitle, links: footer.product },
    { title: footer.companyTitle, links: footer.company },
    { title: footer.legalTitle, links: footer.legal },
  ];

  return (
    <footer className="border-t border-white/10 bg-[#03050A]">
      <MarketingContainer className="py-14 sm:py-18">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <MarketingLogo />
            <p className="mt-4 text-[0.8125rem] leading-relaxed text-white/45">
              {footer.tagline}
            </p>
            <a
              href={`mailto:${footer.contact}`}
              className="mt-5 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-white/65 transition-colors hover:text-white"
            >
              {footer.contact}
            </a>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-white/30">
                {column.title}
              </p>
              <div className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <Link
                    key={link.label}
                    href={publicHref(locale, link.href)}
                    className="text-[0.8125rem] text-white/50 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-[0.6875rem] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Pashove · {footer.rights}</p>
          <p>{footer.madeIn}</p>
        </div>
      </MarketingContainer>
    </footer>
  );
}
