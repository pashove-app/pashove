import { LOCALE_META, type Locale } from "@/i18n/config";
import { formatMoney } from "@/lib/money";
import { publicUrl } from "@/lib/r2/media";
import type { PublicStore } from "@/lib/storefront/queries";
import type { StoreProduct } from "@/lib/storefront/products";
import type { PublicCollection } from "@/lib/storefront/collections";
import type { NavItem } from "@/lib/storefront/navigation";
import type {
  ThemeCollectionCard,
  ThemeProductCard,
  ThemeRenderContext,
} from "@/components/theme-renderer/context";
import type { PricedStoreProduct } from "@/lib/storefront/products";

const FALLBACK_NAV: { key: string; href: string; labels: Record<string, string> }[] = [
  { key: "home", href: "", labels: { fr: "Accueil", en: "Home" } },
  { key: "products", href: "/categories", labels: { fr: "Boutique", en: "Shop" } },
  { key: "collections", href: "/collections", labels: { fr: "Collections", en: "Collections" } },
  { key: "about", href: "/about", labels: { fr: "À propos", en: "About" } },
  { key: "faq", href: "/faq", labels: { fr: "FAQ", en: "FAQ" } },
  { key: "contact", href: "/contact", labels: { fr: "Contact", en: "Contact" } },
];

function paymentMethods(country: string, cod: boolean): string[] {
  const byCountry: Record<string, string[]> = {
    ML: ["Orange Money", "Moov Money", "Carte bancaire"],
    SN: ["Orange Money", "Wave", "Free Money", "Carte bancaire"],
    CI: ["Orange Money", "MTN MoMo", "Moov Money", "Wave", "Carte bancaire"],
    GH: ["MTN MoMo", "Vodafone Cash", "AirtelTigo", "Carte bancaire"],
    BF: ["Orange Money", "Moov Money", "Carte bancaire"],
    TG: ["T-Money", "Moov Money", "Carte bancaire"],
    BJ: ["MTN MoMo", "Moov Money", "Carte bancaire"],
  };

  const methods = byCountry[country] ?? ["Mobile Money", "Carte bancaire"];
  return cod ? [...methods, "Paiement à la livraison"] : methods;
}

export function productCard(
  product: StoreProduct,
  store: Pick<PublicStore, "currency" | "slug">,
  locale: Locale,
): ThemeProductCard {
  const localeTag = LOCALE_META[locale].tag;
  const firstImage = product.images[0]
    ? publicUrl(product.images[0].object_key)
    : product.description_image
      ? publicUrl(product.description_image.object_key)
      : null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    priceLabel: formatMoney(product.price_amount, store.currency, localeTag),
    compareAtLabel:
      product.compare_at_amount && product.compare_at_amount > product.price_amount
        ? formatMoney(product.compare_at_amount, store.currency, localeTag)
        : null,
    imageUrl: firstImage,
    vendor: product.partner_store?.name ?? null,
    badge: product.product_type === "digital" ? "Numérique" : product.product_type === "service" ? "Service" : null,
    discountPercent:
      product.compare_at_amount && product.compare_at_amount > product.price_amount
        ? Math.round((1 - product.price_amount / product.compare_at_amount) * 100)
        : null,
    createdAt: undefined,
  };
}

function collectionCard(collection: PublicCollection): ThemeCollectionCard {
  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    imageUrl: collection.image_key ? publicUrl(collection.image_key) : null,
    productCount: collection.product_count,
  };
}

export function buildStoreRenderContext(input: {
  store: PublicStore;
  locale: Locale;
  nav: NavItem[];
  products: StoreProduct[];
  collections: PublicCollection[];
  metafields?: Record<string, Record<string, unknown>>;
  appEmbeds?: { appId: string; name: string; settings: Record<string, unknown> }[];
}): ThemeRenderContext {
  const { store, locale, nav, products, collections } = input;
  const homePath = `/${locale}/store/${store.slug}`;
  const localeTag = LOCALE_META[locale].tag;

  const navItems =
    nav.length > 0
      ? nav.map((item) => ({ label: item.label, href: item.href.replace(`/${locale}/store/${store.slug}`, "") }))
      : FALLBACK_NAV.map((item) => ({
          label: item.labels[locale] ?? item.labels.fr,
          href: item.href,
        }));

  return {
    storeId: store.id,
    storeName: store.name,
    storeSlug: store.slug,
    homePath,
    locale,
    localeTag,
    currency: store.currency,
    country: store.country,
    description: store.description ?? store.hero_subtitle ?? null,
    logoUrl: store.logo ? publicUrl(store.logo.object_key) : null,
    contactEmail: store.contact_email,
    contactPhone: store.contact_phone,
    codEnabled: store.cod_enabled,
    shippingLabel:
      store.shipping_flat_amount === 0
        ? "Livraison offerte"
        : `Livraison : ${formatMoney(store.shipping_flat_amount, store.currency, localeTag)}`,
    paymentMethods: paymentMethods(store.country, store.cod_enabled),
    nav: navItems,
    products: products.map((product) => productCard(product, store, locale)),
    collections: collections.map((collection) => collectionCard(collection)),
    metafields: input.metafields,
    appEmbeds: input.appEmbeds,
  };
}

export { paymentMethods as paymentMethodsForCountry };

/** Produit prêt à afficher, pour les aperçus et la fiche produit. */
export function toPricedProduct(
  product: StoreProduct,
  store: Pick<PublicStore, "currency" | "shipping_flat_amount">,
  locale: Locale,
): PricedStoreProduct {
  const localeTag = LOCALE_META[locale].tag;
  const price = (amount: number) => formatMoney(amount, store.currency, localeTag);
  const percentOff = (value: number, compare: number | null): number | null =>
    compare && compare > value ? Math.round((1 - value / compare) * 100) : null;

  return {
    ...product,
    priceLabel: price(product.price_amount),
    compareAtLabel:
      product.compare_at_amount && product.compare_at_amount > product.price_amount
        ? price(product.compare_at_amount)
        : null,
    discountPercent: percentOff(product.price_amount, product.compare_at_amount),
    shippingLabel:
      store.shipping_flat_amount === 0
        ? "Livraison offerte"
        : `Livraison : ${price(store.shipping_flat_amount)}`,
    variants: product.variants.map((variant) => ({
      ...variant,
      priceLabel: price(variant.price_amount),
      compareAtLabel:
        product.compare_at_amount && product.compare_at_amount > variant.price_amount
          ? price(product.compare_at_amount)
          : null,
      discountPercent: percentOff(variant.price_amount, product.compare_at_amount),
    })),
  };
}
