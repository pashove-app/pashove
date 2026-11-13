import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/storefront/container";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { publicUrl } from "@/lib/r2/media";
import { listPublicCollections } from "@/lib/storefront/collections";
import { loadStorefront } from "@/lib/storefront/queries";

export const revalidate = 60;
export const metadata: Metadata = { robots: { index: true, follow: true } };

export default async function StoreCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const { store } = await loadStorefront(slug);
  if (!store) notFound();
  const t = await getDictionary(locale);
  const collections = await listPublicCollections(store.id);

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />
      <Container className="py-12 sm:py-16">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-subtle">
          Catalogue
        </p>
        <h1 className="mt-2 text-[2rem] font-medium tracking-[-0.03em] text-fg sm:text-[2.5rem]">
          Catégories
        </h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
          Parcours les collections de {store.name}.
        </p>

        {collections.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-12 text-center text-[0.875rem] text-subtle">
            Aucune catégorie publiée pour l’instant.
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <li key={collection.id}>
                <Link
                  href={`/${locale}/store/${store.slug}/collections/${collection.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-border-strong"
                >
                  <div className="relative aspect-[16/10] bg-hairline">
                    {collection.image_key ? (
                      <Image
                        src={publicUrl(collection.image_key)}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <p className="text-[0.9375rem] font-medium text-fg">
                      {collection.name}
                    </p>
                    <p className="mt-0.5 text-[0.75rem] text-subtle">
                      {collection.product_count} produit
                      {collection.product_count === 1 ? "" : "s"}
                    </p>
                    {collection.description ? (
                      <p className="mt-1.5 line-clamp-2 text-[0.8125rem] text-muted">
                        {collection.description}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </StorefrontShell>
  );
}
