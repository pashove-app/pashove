import Image from "next/image";
import Link from "next/link";
import { BRAND_GRADIENT } from "@/components/storefront/brand";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { publicUrl } from "@/lib/r2/media";
import type { TagCollection } from "@/lib/storefront/collections";

/**
 * Collections provisoires issues des tags. L'interface est déjà celle des
 * vraies collections : visuel, nom, nombre de pièces.
 */
export function CollectionsStrip({
  collections,
  labels,
  locale,
  slug,
}: {
  collections: TagCollection[];
  labels: Dictionary["storefront"];
  locale: Locale;
  slug: string;
}) {
  if (collections.length === 0) return null;

  const usedImages = new Set<string>();
  const gradients = [
    "from-[#0a1330] to-[#1d4ed8]",
    "from-[#1f2937] to-[#6b7280]",
    "from-[#3b2a1e] to-[#a9744f]",
    "from-[#2c1f3d] to-[#7c5aa6]",
    "from-[#0f2e2b] to-[#2f7d72]",
    "from-[#3a1f2b] to-[#a35a76]",
  ];

  return (
    <section id="collections" className="scroll-mt-24">
      <div>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-subtle">
          {labels.collectionsEyebrow}
        </p>
        <h2 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {labels.collectionsTitle}
        </h2>
      </div>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
        {collections.map((collection, index) => {
          const showImage =
            Boolean(collection.imageKey) &&
            !usedImages.has(collection.imageKey as string);

          if (showImage) usedImages.add(collection.imageKey as string);

          return (
          <Link
            key={collection.tag}
            href={path(
              locale,
              `/store/${slug}/collections/${encodeURIComponent(collection.tag)}`,
            )}
            className="group relative block w-40 shrink-0 overflow-hidden rounded-2xl sm:w-auto"
          >
            <div className="relative aspect-[3/4] bg-hairline">
              {showImage ? (
                <Image
                  src={publicUrl(collection.imageKey as string)}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 160px, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              ) : (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    gradients[index % gradients.length] ?? BRAND_GRADIENT
                  }`}
                  aria-hidden="true"
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[4rem] font-medium uppercase text-white/15">
                    {collection.tag.slice(0, 1)}
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />

              <div className="absolute inset-x-3 bottom-3">
                <p className="text-[0.875rem] font-medium text-white">
                  {collection.tag}
                </p>
                <p className="mt-0.5 text-[0.6875rem] text-white/70">
                  {(collection.count === 1
                    ? labels.collectionCount
                    : labels.collectionCountPlural
                  ).replace("{count}", String(collection.count))}
                </p>
              </div>
            </div>
          </Link>
          );
        })}
      </div>
    </section>
  );
}
