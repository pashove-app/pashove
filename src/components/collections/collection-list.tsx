import Image from "next/image";
import Link from "next/link";
import { DeleteCollectionButton } from "@/components/collections/delete-collection-button";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type { CollectionSummary } from "@/lib/collections/queries";
import { publicUrl } from "@/lib/r2/media";

/** Les collections de la boutique : tableau desktop, cartes mobile. */
export function CollectionList({
  t,
  locale,
  collections,
}: {
  t: Dictionary;
  locale: Locale;
  collections: CollectionSummary[];
}) {
  const labels = t.dashboard.collections;

  const count = (value: number) =>
    (value === 1 ? labels.productCount : labels.productCountPlural).replace(
      "{count}",
      String(value),
    );

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="hidden w-full md:table">
        <thead>
          <tr className="border-b border-border text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-faint">
            <th className="px-5 py-3 text-start font-semibold">
              {labels.columnCollection}
            </th>
            <th className="px-4 py-3 text-start font-semibold">
              {labels.columnProducts}
            </th>
            <th className="px-4 py-3 text-start font-semibold">
              {labels.columnStatus}
            </th>
            <th className="px-5 py-3 text-end font-semibold">
              {labels.columnActions}
            </th>
          </tr>
        </thead>

        <tbody>
          {collections.map((collection) => (
            <tr
              key={collection.id}
              className="border-b border-border align-middle last:border-0"
            >
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <Cover collection={collection} />

                  <div className="min-w-0">
                    <Link
                      href={path(locale, `/app/collections/${collection.id}`)}
                      className="block max-w-[22rem] truncate text-[0.875rem] font-medium text-fg transition-colors hover:text-accent"
                    >
                      {collection.name}
                    </Link>
                    <p
                      dir="ltr"
                      className="truncate font-mono text-[0.75rem] text-faint"
                    >
                      /{collection.slug}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3 text-[0.8125rem] tabular-nums text-muted">
                {count(collection.product_count)}
              </td>

              <td className="px-4 py-3">
                <StatusBadge published={collection.is_published} labels={labels} />
              </td>

              <td className="px-5 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={path(locale, `/app/collections/${collection.id}`)}
                    aria-label={labels.edit}
                    title={labels.edit}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-hairline hover:text-fg"
                  >
                    <Icon path={icons.pencil} className="h-4 w-4" strokeWidth={1.6} />
                  </Link>

                  <DeleteCollectionButton
                    locale={locale}
                    collectionId={collection.id}
                    labels={labels}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden">
        {collections.map((collection) => (
          <li key={collection.id} className="p-4">
            <div className="flex items-start gap-3">
              <Cover collection={collection} />

              <Link
                href={path(locale, `/app/collections/${collection.id}`)}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-[0.875rem] font-medium text-fg">
                  {collection.name}
                </p>
                <p dir="ltr" className="truncate font-mono text-[0.75rem] text-faint">
                  /{collection.slug}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge published={collection.is_published} labels={labels} />
                  <span className="text-[0.75rem] text-subtle">
                    {count(collection.product_count)}
                  </span>
                </div>
              </Link>
            </div>

            <div className="mt-2 flex items-center justify-end gap-1 border-t border-hairline pt-2">
              <Link
                href={path(locale, `/app/collections/${collection.id}`)}
                className="rounded-lg px-2.5 py-1.5 text-[0.75rem] font-medium text-subtle transition-colors hover:bg-hairline hover:text-fg"
              >
                {labels.edit}
              </Link>

              <DeleteCollectionButton
                locale={locale}
                collectionId={collection.id}
                labels={labels}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Cover({ collection }: { collection: CollectionSummary }) {
  const url = collection.image?.object_key
    ? publicUrl(collection.image.object_key)
    : null;

  return (
    <span className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg border border-hairline bg-hairline">
      {url ? (
        <Image src={url} alt="" fill sizes="56px" className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-faint">
          <Icon path={icons.layers} className="h-5 w-5" strokeWidth={1.5} />
        </span>
      )}
    </span>
  );
}

function StatusBadge({
  published,
  labels,
}: {
  published: boolean;
  labels: Dictionary["dashboard"]["collections"];
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium",
        published
          ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
          : "bg-hairline text-subtle",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          published ? "bg-emerald-500" : "bg-faint",
        )}
      />
      {published ? labels.published : labels.draft}
    </span>
  );
}
