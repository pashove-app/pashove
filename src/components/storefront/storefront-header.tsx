import Image from "next/image";
import Link from "next/link";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { CartButton } from "@/components/storefront/cart-provider";
import { Container } from "@/components/storefront/container";
import { MobileMenu } from "@/components/storefront/mobile-menu";
import { StoreMonogram } from "@/components/storefront/store-monogram";
import { LOCALE_META, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import { publicUrl } from "@/lib/r2/media";
import type { PublicStore } from "@/lib/storefront/queries";
import { path } from "@/components/ui/types";

/**
 * En-tête de la vitrine : bandeau d'annonce, logo cliquable, navigation
 * réelle, panier et menu mobile.
 */
export function StorefrontHeader({
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

  const messages = [
    store.shipping_flat_amount === 0
      ? labels.announcementFreeShipping
      : labels.announcementShipping.replace("{amount}", price),
    ...(store.cod_enabled ? [labels.announcementCod] : []),
  ];

  const links = [
    { href: home, label: labels.navHome },
    { href: `${home}#products`, label: labels.navNew },
    { href: `${home}#collections`, label: labels.navCollections },
    { href: `${home}#contact`, label: labels.navContact },
  ];

  return (
    <>
      <AnnouncementBar messages={messages} />

      <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-xl">
        <Container className="flex h-16 items-center gap-3">
          <Link
            href={home}
            className="flex min-w-0 items-center gap-2.5"
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

          <nav className="ms-6 hidden items-center gap-7 md:flex">
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

          <div className="ms-auto flex items-center gap-2">
            <CartButton />
            <MobileMenu links={links} labels={labels} />
          </div>
        </Container>
      </header>
    </>
  );
}
