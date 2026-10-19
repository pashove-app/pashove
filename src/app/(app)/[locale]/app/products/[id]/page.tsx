import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getProduct } from "@/lib/products/queries";
import { publicUrl } from "@/lib/r2/media";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.products.editTitle };
}

const TYPE_LABEL = {
  physical: "physicalTitle",
  digital: "digitalTitle",
  service: "serviceTitle",
} as const;

/**
 * Édition d'un produit.
 *
 * Le type enregistré fait foi ; les champs affichés en dépendent. Un produit
 * d'une autre boutique est introuvable, même s'il est publié.
 */
export default async function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const product = await getProduct(id, store.id);
  if (!product) notFound();

  const t = await getDictionary(locale);
  const labels = t.dashboard.products;

  const initialImage = product.image
    ? { id: product.image.id, url: publicUrl(product.image.object_key) }
    : null;

  const initialFile = product.digital_file
    ? { id: product.digital_file.id, name: product.digital_file.name }
    : null;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href={path(locale, "/app/products")}
        className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-soft"
      >
        <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {labels.back}
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {labels.editTitle}
        </h1>
        <span className="rounded-full border border-border-soft bg-hairline px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-subtle">
          {labels[TYPE_LABEL[product.product_type]]}
        </span>
      </div>

      <p className="mt-2 text-[0.9375rem] text-muted">{product.name}</p>

      <ProductForm
        t={t}
        locale={locale}
        mode="edit"
        type={product.product_type}
        currency={store.currency}
        storeSlug={store.slug}
        product={product}
        initialImage={initialImage}
        initialFile={initialFile}
      />
    </div>
  );
}
