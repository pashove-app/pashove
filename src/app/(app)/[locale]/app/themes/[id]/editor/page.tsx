import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ThemeEditor } from "@/components/theme-editor/editor";
import { resolveLocale } from "@/i18n/config";
import { publicUrl } from "@/lib/r2/media";
import { listProducts, type Product } from "@/lib/products/queries";
import { listCollections } from "@/lib/collections/queries";
import { listNavItems } from "@/lib/storefront/navigation";
import { currentMembership } from "@/lib/stores/queries";
import { createClient } from "@/lib/supabase/server";
import { loadEditorData } from "@/lib/theme-editor/queries";
import {
  buildStoreRenderContext,
  toPricedProduct,
} from "@/lib/theme-editor/render-context";
import type { ThemeMetafieldOption } from "@/components/theme-editor/types";
import type { StoreProduct } from "@/lib/storefront/products";
import type { PublicCollection } from "@/lib/storefront/collections";

export const metadata: Metadata = { robots: { index: false, follow: false } };

function toStoreProduct(product: Product): StoreProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price_amount: product.price_amount,
    compare_at_amount: product.compare_at_amount,
    product_type: product.product_type,
    stock_quantity: product.stock_quantity,
    duration_minutes: product.duration_minutes,
    tags: product.tags,
    shipping_countries: product.shipping_countries,
    options: product.options,
    description_image: product.description_image,
    images: product.images.map((image) => ({ object_key: image.object_key })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      option_values: variant.option_values,
      sku: variant.sku,
      price_amount: variant.price_amount,
      stock_quantity: variant.stock_quantity,
      position: variant.position,
    })),
    partner_source_store_id: null,
    partner_store: null,
  };
}

export default async function ThemeEditorPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale(raw);

  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/onboarding/store`);

  const store = membership.store;
  const [editorData, products, collections, nav, metafieldsResult] = await Promise.all([
    loadEditorData(store.id),
    listProducts(store.id),
    listCollections(store.id),
    listNavItems(store.id),
    createClient().then((supabase) =>
      supabase
        .from("metafields")
        .select("id, owner_type, owner_id, namespace, key, value, type")
        .eq("store_id", store.id)
        .order("key", { ascending: true }),
    ),
  ]);

  const theme = editorData.themes.find((entry) => entry.id === id) ?? editorData.themes[0];
  if (!theme) notFound();

  const storeProducts = products.map(toStoreProduct);
  const publicCollections: PublicCollection[] = collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    image_key: collection.image?.object_key ?? null,
    product_count: collection.product_count,
  }));

  const metafields: ThemeMetafieldOption[] = (
    (metafieldsResult.data ?? []) as {
      id: string;
      owner_type: ThemeMetafieldOption["owner"];
      owner_id: string;
      namespace: string;
      key: string;
      value: unknown;
      type: string;
    }[]
  ).map((row) => ({
    id: row.id,
    owner: row.owner_type,
    ownerId: row.owner_id,
    namespace: row.namespace,
    key: row.key,
    label:
      typeof row.value === "string"
        ? row.value.slice(0, 80)
        : row.value == null
          ? row.key
          : JSON.stringify(row.value).slice(0, 80),
    value: row.value,
  }));

  const renderContext = buildStoreRenderContext({
    store,
    locale,
    nav: nav.filter((item) => item.visible),
    products: storeProducts,
    collections: publicCollections,
    metafields: {
      shop: Object.fromEntries(
        metafields
          .filter((entry) => entry.owner === "shop")
          .map((entry) => [`${entry.namespace}.${entry.key}`, entry.value]),
      ),
    },
    appEmbeds: editorData.appEmbeds
      .filter((embed) => embed.enabled)
      .map((embed) => ({ appId: embed.appId, name: embed.name, settings: embed.settings })),
  });

  const firstProduct = storeProducts[0];
  if (firstProduct) {
    renderContext.product = toPricedProduct(firstProduct, store, locale);
    renderContext.productImages = firstProduct.images.map((image) =>
      publicUrl(image.object_key),
    );
    renderContext.metafields = {
      ...renderContext.metafields,
      product: Object.fromEntries(
        metafields
          .filter((entry) => entry.owner === "product" && entry.ownerId === firstProduct.id)
          .map((entry) => [`${entry.namespace}.${entry.key}`, entry.value]),
      ),
    };
  }

  if (publicCollections[0]) {
    const collection = publicCollections[0];
    renderContext.collection = {
      name: collection.name,
      description: collection.description,
      imageUrl: collection.image_key ? publicUrl(collection.image_key) : null,
      products: renderContext.products,
    };
  }

  return (
    <ThemeEditor
      themeId={theme.id}
      themeName={theme.name}
      themeStatus={theme.status}
      themeActive={theme.isActive}
      initialDocument={theme.draft}
      locale={locale}
      store={{
        id: store.id,
        name: store.name,
        slug: store.slug,
        currency: store.currency,
        country: store.country,
        codEnabled: store.cod_enabled,
      }}
      renderContext={renderContext}
      products={renderContext.products}
      collections={renderContext.collections}
      metafields={metafields}
      appEmbeds={editorData.appEmbeds}
      appBlocks={editorData.appBlocks}
      assignments={editorData.assignments}
    />
  );
}
