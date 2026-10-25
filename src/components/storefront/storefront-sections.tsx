import Link from "next/link";
import { BundleCard } from "@/components/storefront/bundle-card";
import { CollectionCard } from "@/components/storefront/collection-card";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { PublicCollection } from "@/lib/storefront/collections";
import type { PublicBundle } from "@/lib/storefront/bundles";

export function CollectionsSection({
  collections,
  storeSlug,
  locale,
  labels,
}: {
  collections: PublicCollection[];
  storeSlug: string;
  locale: Locale;
  labels: Dictionary["storefront"];
}) {
  if (collections.length === 0) return null;

  return (
    <section className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-subtle">
            {labels.collectionsEyebrow}
          </p>
          <h2 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            {labels.collectionsHomeTitle}
          </h2>
          <p className="mt-1.5 max-w-lg text-[0.875rem] leading-relaxed text-muted">
            {labels.collectionsSubtitle}
          </p>
        </div>

        <Link
          href={path(locale, `/store/${storeSlug}/collections`)}
          className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-soft"
        >
          {labels.collectionsViewAll}
          <Icon path={icons.arrowRight} className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={2} />
        </Link>
      </div>

      <div className="mt-6 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {collections.slice(0, 6).map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            storeSlug={storeSlug}
            locale={locale}
            labels={labels}
          />
        ))}
      </div>
    </section>
  );
}

export function BundlesSection({
  bundles,
  storeSlug,
  locale,
  labels,
}: {
  bundles: PublicBundle[];
  storeSlug: string;
  locale: Locale;
  labels: Dictionary["storefront"];
}) {
  if (bundles.length === 0) return null;

  return (
    <section className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-subtle">
            {labels.featuredEyebrow}
          </p>
          <h2 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            {labels.bundlesTitle}
          </h2>
          <p className="mt-1.5 max-w-lg text-[0.875rem] leading-relaxed text-muted">
            {labels.bundlesSubtitle}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bundles.slice(0, 6).map((bundle) => (
          <BundleCard
            key={bundle.id}
            bundle={bundle}
            storeSlug={storeSlug}
            locale={locale}
            labels={labels}
          />
        ))}
      </div>
    </section>
  );
}
