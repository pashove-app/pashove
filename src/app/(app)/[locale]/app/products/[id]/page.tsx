import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import { PartnerOfferCard } from "@/components/partners/partner-offer-card";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { listDigitalVersions } from "@/lib/digital/queries";
import { getProduct } from "@/lib/products/queries";
import { getPartnerOffer } from "@/lib/partners/queries";
import { publicUrl } from "@/lib/r2/media";
import {
  canManageCatalog,
  currentMembership,
  currentStore,
} from "@/lib/stores/queries";

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

  const membership = await currentMembership();
  const product = await getProduct(id, store.id);
  if (!product) notFound();

  const offer = await getPartnerOffer(product.id, store.id);
  const versions =
    product.product_type === "digital"
      ? await listDigitalVersions(product.id)
      : [];
  const eligible =
    product.product_type === "physical" && product.variants.length === 0;

  const t = await getDictionary(locale);
  const labels = t.dashboard.products;

  const initialImages = product.images.map((image) => ({
    id: image.id,
    url: publicUrl(image.object_key),
  }));

  const initialDescriptionImage =
    product.description_media_id && product.description_image
      ? {
          id: product.description_media_id,
          url: publicUrl(product.description_image.object_key),
        }
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
        initialImages={initialImages}
        initialDescriptionImage={initialDescriptionImage}
        initialFile={initialFile}
      />

      {product.product_type === "digital" && versions.length > 0 ? (
        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="border-b border-hairline px-5 py-4">
            <h2 className="text-[0.9375rem] font-medium text-fg">
              Versions du fichier
            </h2>
            <p className="mt-1 text-[0.75rem] text-subtle">
              Remplacer le fichier numérique crée une nouvelle version. Les acheteurs
              gardent la version achetée ; le filigrane est ajouté au téléchargement.
            </p>
          </div>
          <ul className="divide-y divide-hairline">
            {versions.map((version, index) => (
              <li key={version.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-[0.8125rem] font-medium text-fg">
                    Version {version.version}
                    {index === 0 ? (
                      <span className="ms-2 rounded-full bg-brand-500/10 px-2 py-0.5 text-[0.625rem] font-medium text-accent">
                        Actuelle
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 truncate text-[0.6875rem] text-subtle">
                    {version.file_name ?? "Fichier"} · {version.notes ?? "—"}
                  </p>
                </div>
                <span className="shrink-0 text-[0.625rem] text-faint">
                  {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(
                    new Date(version.created_at),
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {membership && canManageCatalog(membership.role) ? (
        <div className="mt-6">
          <PartnerOfferCard
            t={t}
            locale={locale}
            productId={product.id}
            initial={offer}
            eligible={eligible}
            ineligibleReason={
              product.variants.length > 0 ? "variants" : null
            }
            isCopy={Boolean(product.source_product_id)}
          />
        </div>
      ) : null}
    </div>
  );
}
