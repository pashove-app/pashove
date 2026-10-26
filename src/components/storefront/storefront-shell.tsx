import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/storefront/container";
import { StoreMonogram } from "@/components/storefront/store-monogram";
import { path } from "@/components/ui/types";
import { LOCALE_META, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import { publicUrl } from "@/lib/r2/media";
import type { PublicStore } from "@/lib/storefront/queries";
import { StorefrontChat } from "@/components/messages/chat-widget";
import { getPublicStoreTheme } from "@/lib/theme/queries";
import { themeStyle } from "@/lib/theme/style";
import { ThemeScope } from "@/components/theme/theme-scope";
import { POLICY_PAGES, policyUrlSlug, type PolicySlug } from "@/lib/policies/pages";
import { listPublishedPolicySlugs } from "@/lib/policies/queries";

/** Coquille de la vitrine : fond du thème, contenu, pied de page complet. */
export async function StorefrontShell({
  store,
  locale,
  t,
  children,
}: {
  store: PublicStore;
  locale: Locale;
  t: Dictionary;
  children: ReactNode;
}) {
  const [policySlugs, theme] = await Promise.all([
    listPublishedPolicySlugs(store.id),
    getPublicStoreTheme(store.slug),
  ]);

  const style = themeStyle(theme);

  return (
    <div className="flex min-h-dvh flex-col bg-bg" style={style}>
      <ThemeScope style={style} />
      <div className="flex-1">{children}</div>
      <StorefrontFooter
        store={store}
        locale={locale}
        t={t}
        policySlugs={policySlugs}
      />
      <StorefrontChat
        slug={store.slug}
        locale={locale}
        labels={t.messages}
        localeTag={LOCALE_META[locale].tag}
      />
    </div>
  );
}

function StorefrontFooter({
  store,
  locale,
  t,
  policySlugs,
}: {
  store: PublicStore;
  locale: Locale;
  t: Dictionary;
  policySlugs: PolicySlug[];
}) {
  const labels = t.storefront;
  const home = path(locale, `/store/${store.slug}`);
  const price = formatMoney(
    store.shipping_flat_amount,
    store.currency,
    LOCALE_META[locale].tag,
  );

  return (
    <footer id="contact" className="mt-20 border-t border-border bg-surface/50 scroll-mt-24">
      <Container className="py-12 sm:py-16">
        <div
          className={
            policySlugs.length > 0
              ? "grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]"
              : "grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]"
          }
        >
          <div className="max-w-sm">
            <Link href={home} className="flex items-center gap-2.5">
              {store.logo ? (
                <Image
                  src={publicUrl(store.logo.object_key)}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-xl border border-border-soft object-cover"
                />
              ) : (
                <StoreMonogram name={store.name} size="sm" />
              )}
              <span className="truncate text-[1.0625rem] font-medium tracking-[-0.03em] text-fg">
                {store.name}
              </span>
            </Link>

            {store.hero_subtitle || store.description ? (
              <p className="mt-4 line-clamp-3 text-[0.8125rem] leading-relaxed text-subtle">
                {store.hero_subtitle ?? store.description}
              </p>
            ) : null}
          </div>

          <nav>
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-faint">
              {labels.footerShop}
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              <Link href={home} className="text-[0.8125rem] text-subtle transition-colors hover:text-fg">
                {labels.navHome}
              </Link>
              <Link href={`${home}#products`} className="text-[0.8125rem] text-subtle transition-colors hover:text-fg">
                {labels.navNew}
              </Link>
              <Link href={path(locale, `/store/${store.slug}/cart`)} className="text-[0.8125rem] text-subtle transition-colors hover:text-fg">
                {labels.viewCart}
              </Link>
            </div>
          </nav>

          {policySlugs.length > 0 ? (
            <nav>
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-faint">
                {t.policies.footerTitle}
              </p>
              <div className="mt-4 flex flex-col gap-2.5">
                {POLICY_PAGES.filter((page) =>
                  policySlugs.includes(page.slug),
                ).map((page) => (
                  <Link
                    key={page.slug}
                    href={path(
                      locale,
                      `/store/${store.slug}/pages/${policyUrlSlug(page.slug)}`,
                    )}
                    className="text-[0.8125rem] text-subtle transition-colors hover:text-fg"
                  >
                    {t.policies[page.slug]}
                  </Link>
                ))}
              </div>
            </nav>
          ) : null}

          <div>
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-faint">
              {labels.footerHelp}
            </p>
            <div className="mt-4 flex flex-col gap-2.5 text-[0.8125rem] text-subtle">
              {store.contact_email ? (
                <a href={`mailto:${store.contact_email}`} dir="ltr" className="truncate transition-colors hover:text-fg">
                  {store.contact_email}
                </a>
              ) : null}
              {store.contact_phone ? (
                <a href={`tel:${store.contact_phone}`} dir="ltr" className="truncate transition-colors hover:text-fg">
                  {store.contact_phone}
                </a>
              ) : null}
              <p>
                {store.shipping_flat_amount === 0
                  ? labels.freeShipping
                  : `${labels.shipping} : ${price}`}
              </p>
              {store.cod_enabled ? <p>{labels.codInfo}</p> : null}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-[0.6875rem] text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {store.name} · {labels.footerRights}
          </p>
          <Link href="https://pashove.com" className="transition-colors hover:text-muted">
            {labels.poweredBy}
          </Link>
        </div>
      </Container>
    </footer>
  );
}
