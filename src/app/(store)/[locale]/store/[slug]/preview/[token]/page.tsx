import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { ThemeDocumentRenderer } from "@/components/theme-renderer/theme-document";
import { LOCALE_META, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { publicUrl } from "@/lib/r2/media";
import { listStoreProducts, getStoreProduct } from "@/lib/storefront/products";
import { listPublicCollections } from "@/lib/storefront/collections";
import { listPublicNav } from "@/lib/storefront/navigation";
import { loadStorefront } from "@/lib/storefront/queries";
import { buildStoreRenderContext, toPricedProduct } from "@/lib/theme-editor/render-context";
import { getPreviewDocument, getPublicMetafields } from "@/lib/theme-editor/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ThemePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string; token: string }>;
  searchParams: Promise<{ template?: string; product?: string }>;
}) {
  const { locale, slug, token } = await params;
  if (!isLocale(locale)) notFound();

  const { status, store } = await loadStorefront(slug);
  if (status !== "active" || !store) notFound();

  const preview = await getPreviewDocument(token);
  if (!preview) notFound();

  const [t, products, collections, nav, query, shopMetafields] = await Promise.all([
    getDictionary(locale),
    listStoreProducts(store.id),
    listPublicCollections(store.id),
    listPublicNav(store.id),
    searchParams,
    getPublicMetafields(slug, "shop", store.id),
  ]);

  const requested = query.template ?? "index";
  const template =
    preview.document.templates.find((entry) => entry.id === requested) ??
    preview.document.templates.find((entry) => entry.type === requested) ??
    preview.document.templates.find((entry) => entry.type === "index") ??
    preview.document.templates[0];

  const context = buildStoreRenderContext({
    store,
    locale,
    nav,
    products,
    collections,
    metafields: { shop: shopMetafields },
    appEmbeds: preview.appEmbeds,
  });

  if (template?.type === "product") {
    const product = query.product
      ? await getStoreProduct(store.id, query.product)
      : products[0];

    if (product) {
      const metafields = await getPublicMetafields(slug, "product", product.id);
      context.product = toPricedProduct(product, store, locale);
      context.productImages = product.images.map((image) => publicUrl(image.object_key));
      context.metafields = { ...context.metafields, product: metafields };
    }
  }

  if (template?.type === "collection" && collections[0]) {
    const collection = collections[0];
    context.collection = {
      name: collection.name,
      description: collection.description,
      imageUrl: collection.image_key ? publicUrl(collection.image_key) : null,
      products: context.products,
    };
  }

  if (template?.type === "search") {
    context.search = {
      query: "nouveauté",
      results: context.products.slice(0, 8),
      emptyText: "Aucun produit ne correspond à cette recherche.",
    };
  }

  if (template?.type === "page" || template?.type === "list-collections") {
    context.page = {
      title: "À propos de la boutique",
      content:
        "Bienvenue ! Cette page est un aperçu de ton modèle. Le contenu réel viendra de la page choisie dans la boutique.",
    };
  }

  if (template?.type === "blog" || template?.type === "article") {
    context.posts = [
      {
        id: "preview-post",
        title: "Le premier article de ton journal",
        slug: "premier-article",
        excerpt:
          "Un aperçu de la mise en page de tes articles : titre, extrait, image et date.",
        imageUrl: store.banner ? publicUrl(store.banner.object_key) : null,
        publishedAt: "Aujourd’hui",
        author: store.name,
      },
    ];
    context.article = {
      title: "Le premier article de ton journal",
      content:
        "Ceci est un aperçu. Le contenu réel de ton article s’affichera ici, avec sa mise en forme et ses images.",
      imageUrl: store.banner ? publicUrl(store.banner.object_key) : null,
      publishedAt: "Aujourd’hui",
      author: store.name,
    };
  }

  if (template?.type === "cart") {
    context.cart = {
      lines: context.products.slice(0, 2).map((product, index) => ({
        id: product.id,
        name: product.name,
        quantity: index + 1,
        priceLabel: product.priceLabel,
        imageUrl: product.imageUrl,
      })),
      subtotalLabel: context.products[0]?.priceLabel ?? "0",
      count: 2,
    };
  }

  return (
    <StorefrontShell store={store} locale={locale} t={t} hideFooter>
      <div className="bg-amber-500 px-4 py-2 text-center text-[11px] font-semibold text-black">
        Aperçu privé — ce brouillon n’est pas encore en ligne · {LOCALE_META[locale].native}
      </div>
      <ThemeDocumentRenderer
        document={preview.document}
        context={context}
        templateId={template?.id ?? "index"}
      />
    </StorefrontShell>
  );
}
