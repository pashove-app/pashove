import { listStoreProducts, type StoreProduct } from "@/lib/storefront/products";
import { listPublicCollections, type PublicCollection } from "@/lib/storefront/collections";
import { listPublicNav, type NavItem } from "@/lib/storefront/navigation";
import type { PublicStore } from "@/lib/storefront/queries";
import type { Locale } from "@/i18n/config";
import type { ThemeRenderContext } from "@/components/theme-renderer/context";
import {
  getPublicMetafields,
  getPublicThemeDocument,
  type PublicThemeDocument,
} from "@/lib/theme-editor/queries";
import { buildStoreRenderContext, productCard } from "@/lib/theme-editor/render-context";

export type ThemedStorefront = {
  theme: PublicThemeDocument;
  context: ThemeRenderContext;
  products: StoreProduct[];
  collections: PublicCollection[];
  nav: NavItem[];
  toCard: (product: StoreProduct) => ReturnType<typeof productCard>;
};

/**
 * Charge le thème publié et toutes les données de vitrine nécessaires.
 * Retourne `null` si la boutique utilise encore le thème historique : les
 * pages gardent alors leur rendu d’origine.
 */
export async function loadThemedStorefront(
  store: PublicStore,
  locale: Locale,
): Promise<ThemedStorefront | null> {
  const [theme, products, collections, nav, shopMetafields] = await Promise.all([
    getPublicThemeDocument(store.slug),
    listStoreProducts(store.id),
    listPublicCollections(store.id),
    listPublicNav(store.id),
    getPublicMetafields(store.slug, "shop", store.id),
  ]);

  if (!theme) return null;

  const context = buildStoreRenderContext({
    store,
    locale,
    nav,
    products,
    collections,
    metafields: { shop: shopMetafields },
    appEmbeds: theme.appEmbeds,
  });

  return {
    theme,
    context,
    products,
    collections,
    nav,
    toCard: (product) => productCard(product, store, locale),
  };
}
