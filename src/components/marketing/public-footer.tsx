import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { SiteContent } from "@/lib/marketing/content";
import { MarketingContainer, MarketingLogo, publicHref } from "@/components/marketing/ui";
import { PublicLanguageSwitch } from "@/components/marketing/language-switch";

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
    { title: footer.developerTitle, links: footer.developers },
  ];

  return (
    <footer className="border-t border-white/10 bg-[#03050A]">
      <MarketingContainer className="py-14 sm:py-18">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <MarketingLogo />
            <p className="mt-4 text-[0.8125rem] leading-relaxed text-white/45">
              {footer.tagline}
            </p>
            <a
              href={`mailto:${footer.contact}`}
              className="mt-4 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand-300 transition-colors hover:text-white"
            >
              {footer.contact}
            </a>

            <div className="mt-6 flex items-center gap-3">
              <span className="text-[0.625rem] uppercase tracking-[0.12em] text-white/25">
                {footer.languageLabel}
              </span>
              <PublicLanguageSwitch locale={locale === "en" ? "en" : "fr"} />
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-white/30">
                {column.title}
              </p>
              <div className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) =>
                  "soon" in link && link.soon ? (
                    <span
                      key={link.label}
                      className="inline-flex items-center gap-1.5 text-[0.8125rem] text-white/25"
                    >
                      {link.label}
                      <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[0.5rem] uppercase tracking-wide text-white/30">
                        {footer.soonLabel}
                      </span>
                    </span>
                  ) : (
                    <Link
                      key={link.label}
                      href={publicHref(locale, link.href)}
                      className="text-[0.8125rem] text-white/50 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.6875rem] text-white/30">
            © {new Date().getFullYear()} Pashove · {footer.rights}
          </p>
          <div className="flex items-center gap-4">
            <p className="text-[0.6875rem] text-white/30">{footer.madeIn}</p>
            <div className="flex items-center gap-2">
              {footer.social.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-[0.5625rem] font-semibold text-white/45 transition-colors hover:border-brand-400/30 hover:text-white"
                >
                  {social.label === "LinkedIn" ? "in" : social.label === "Instagram" ? "ig" : "X"}
                </a>
              ))}
            </div>
          </div>
        </div>
      </MarketingContainer>
    </footer>
  );
}
