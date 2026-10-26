import Image from "next/image";
import Link from "next/link";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { CartButton } from "@/components/storefront/cart-provider";
import { Container } from "@/components/storefront/container";
import { Icon, icons } from "@/components/ui/primitives";
import { HeaderSelectors } from "@/components/storefront/header-selectors";
import { MobileMenu } from "@/components/storefront/mobile-menu";
import { StoreMonogram } from "@/components/storefront/store-monogram";
import { LOCALE_META, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import { publicUrl } from "@/lib/r2/media";
import type { PublicStore } from "@/lib/storefront/queries";
import { readCart } from "@/lib/storefront/cart";
import { path } from "@/components/ui/types";

/**
 * En-tête de la vitrine : bandeau d'annonce, logo cliquable, navigation
 * réelle, panier et menu mobile.
 */
export async function StorefrontHeader({
  store,
  locale,
  t,
}: {
  store: PublicStore;
  locale: Locale;
  t: Dictionary;
}) {
  const labels = t.storefront;
  const home = path(locale, `/store/${store.slug}`);
  const price = formatMoney(
    store.shipping_flat_amount,
    store.currency,
    LOCALE_META[locale].tag,
  );

  const cart = await readCart(LOCALE_META[locale].tag);
  const instantOnly = Boolean(
    cart &&
      cart.items.length > 0 &&
      cart.items.every(
        (item) =>
          item.productType === "digital" || item.productType === "service",
      ),
  );

  const messages = instantOnly
    ? [labels.announcementInstant]
    : [
        store.shipping_flat_amount === 0
          ? labels.announcementFreeShipping
          : labels.announcementShipping.replace("{amount}", price),
        ...(store.cod_enabled ? [labels.announcementCod] : []),
      ];

  const links = [
    { href: home, label: labels.navHome },
    { href: path(locale, `/store/${store.slug}/collections`), label: labels.navCollections },
    { href: `${home}#products`, label: labels.navNew },
    { href: `${home}#contact`, label: labels.navContact },
  ];

  const iconButton =
    "flex h-10 w-10 items-center justify-center rounded-xl text-body transition-colors hover:bg-hairline hover:text-fg";
  const searchHref = path(locale, `/store/${store.slug}/search`);
  const accountHref = path(locale, `/store/${store.slug}/account`);

  return (
    <>
      <AnnouncementBar messages={messages} />

      <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-xl">
        <Container className="grid h-16 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:gap-3">
          <Link
            href={home}
            className="flex min-w-0 items-center justify-self-start gap-2.5"
            aria-label={store.name}
          >
            {store.logo ? (
              <Image
                src={publicUrl(store.logo.object_key)}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 rounded-xl border border-border-soft object-cover"
              />
            ) : (
              <StoreMonogram name={store.name} size="sm" />
            )}

            <span className="min-w-0 truncate text-[1.0625rem] font-medium tracking-[-0.03em] text-fg">
              {store.name}
            </span>
          </Link>

          <nav className="hidden items-center justify-center gap-7 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-subtle transition-colors hover:text-fg"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-1">
            <Link
              href={searchHref}
              aria-label={labels.searchTitle}
              title={labels.searchTitle}
              className={iconButton}
            >
              <Icon path={icons.search} className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} />
            </Link>

            <Link
              href={accountHref}
              aria-label={labels.accountTitle}
              title={labels.accountTitle}
              className={iconButton}
            >
              <Icon path={icons.user} className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} />
            </Link>

            <div className="hidden lg:block">
              <HeaderSelectors
                currency={store.currency}
                locale={locale}
                labels={labels}
              />
            </div>

            <CartButton />

            <MobileMenu
              links={links}
              labels={labels}
              currency={store.currency}
              locale={locale}
            />
          </div>
        </Container>
      </header>
    </>
  );
}
