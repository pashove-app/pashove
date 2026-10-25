import Image from "next/image";
import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { publicUrl } from "@/lib/r2/media";
import type { PublicCollection } from "@/lib/storefront/collections";

export function CollectionCard({
  collection,
  storeSlug,
  locale,
  labels,
}: {
  collection: PublicCollection;
  storeSlug: string;
  locale: Locale;
  labels: Dictionary["storefront"];
}) {
  const count = (
    collection.product_count === 1
      ? labels.collectionCount
      : labels.collectionCountPlural
  ).replace("{count}", String(collection.product_count));

  return (
    <Link
      href={path(locale, `/store/${storeSlug}/collections/${collection.slug}`)}
      className="group block"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-hairline">
        {collection.image_key ? (
          <Image
            src={publicUrl(collection.image_key)}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(47,92,255,0.16),rgba(47,92,255,0.04))] text-accent">
            <Icon path={icons.layers} className="h-8 w-8" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <h3 className="mt-3 text-[0.9375rem] font-medium text-fg transition-colors group-hover:text-accent">
        {collection.name}
      </h3>
      <p className="mt-0.5 text-[0.75rem] text-subtle">{count}</p>
    </Link>
  );
}
