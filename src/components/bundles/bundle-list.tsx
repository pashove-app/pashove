import Image from "next/image";
import Link from "next/link";
import { DeleteBundleButton } from "@/components/bundles/delete-bundle-button";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type { BundleSummary } from "@/lib/bundles/queries";
import { publicUrl } from "@/lib/r2/media";

/** Les paquets de la boutique : tableau desktop, cartes mobile. */
export function BundleList({
  t,
  locale,
  bundles,
}: {
  t: Dictionary;
  locale: Locale;
  bundles: BundleSummary[];
}) {
  const labels = t.dashboard.bundles;

  const items = (count: number) =>
    (count === 1 ? labels.itemCount : labels.itemCountPlural).replace(
      "{count}",
      String(count),
    );

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="hidden w-full lg:table">
        <thead>
          <tr className="border-b border-border text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-faint">
            <th className="px-5 py-3 text-start font-semibold">{labels.columnBundle}</th>
            <th className="px-3 py-3 text-start font-semibold">{labels.columnItems}</th>
            <th className="px-3 py-3 text-end font-semibold">{labels.columnPrice}</th>
            <th className="px-3 py-3 text-end font-semibold">{labels.columnValue}</th>
            <th className="px-3 py-3 text-end font-semibold">{labels.columnSavings}</th>
            <th className="px-3 py-3 text-start font-semibold">{labels.columnStatus}</th>
            <th className="px-5 py-3 text-end font-semibold">{labels.columnActions}</th>
          </tr>
        </thead>

        <tbody>
          {bundles.map((bundle) => (
            <tr key={bundle.id} className="border-b border-border align-middle last:border-0">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <Cover bundle={bundle} />

                  <div className="min-w-0">
                    <Link
                      href={path(locale, `/app/bundles/${bundle.id}`)}
                      className="block max-w-[18rem] truncate text-[0.875rem] font-medium text-fg transition-colors hover:text-accent"
                    >
                      {bundle.name}
                    </Link>
                    <p dir="ltr" className="truncate font-mono text-[0.75rem] text-faint">
                      /{bundle.slug}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-3 py-3 text-[0.8125rem] tabular-nums text-muted">
                {items(bundle.item_count)}
              </td>

              <td className="px-3 py-3 text-end text-[0.875rem] font-medium tabular-nums text-fg">
                {bundle.priceLabel}
              </td>

              <td className="px-3 py-3 text-end text-[0.8125rem] tabular-nums text-faint">
                <span className="line-through">{bundle.sumLabel}</span>
              </td>

              <td className="px-3 py-3 text-end">
                <span className="inline-flex rounded-full bg-emerald-500/12 px-2 py-0.5 text-[0.6875rem] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  −{bundle.savingsLabel}
                </span>
              </td>

              <td className="px-3 py-3">
                <StatusBadge published={bundle.status === "published"} labels={labels} />
              </td>

              <td className="px-5 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={path(locale, `/app/bundles/${bundle.id}`)}
                    aria-label={labels.edit}
                    title={labels.edit}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-hairline hover:text-fg"
                  >
                    <Icon path={icons.pencil} className="h-4 w-4" strokeWidth={1.6} />
                  </Link>

                  <DeleteBundleButton
                    locale={locale}
                    bundleId={bundle.id}
                    labels={labels}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-border lg:hidden">
        {bundles.map((bundle) => (
          <li key={bundle.id} className="p-4">
            <div className="flex items-start gap-3">
              <Cover bundle={bundle} />

              <Link
                href={path(locale, `/app/bundles/${bundle.id}`)}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-[0.875rem] font-medium text-fg">
                  {bundle.name}
                </p>
                <p dir="ltr" className="truncate font-mono text-[0.75rem] text-faint">
                  /{bundle.slug}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge published={bundle.status === "published"} labels={labels} />
                  <span className="text-[0.75rem] text-subtle">
                    {items(bundle.item_count)}
                  </span>
                </div>
              </Link>
            </div>

            <div className="mt-3 flex flex-wrap items-end justify-between gap-2 rounded-xl bg-hairline/50 px-3 py-2.5">
              <div>
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-faint">
                  {labels.columnPrice}
                </p>
                <p className="mt-0.5 text-[0.9375rem] font-medium tabular-nums text-fg">
                  {bundle.priceLabel}
                </p>
              </div>

              <div className="text-end">
                <p className="text-[0.75rem] tabular-nums text-faint line-through">
                  {bundle.sumLabel}
                </p>
                <p className="text-[0.75rem] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  −{bundle.savingsLabel}
                </p>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-end gap-1">
              <Link
                href={path(locale, `/app/bundles/${bundle.id}`)}
                className="rounded-lg px-2.5 py-1.5 text-[0.75rem] font-medium text-subtle transition-colors hover:bg-hairline hover:text-fg"
              >
                {labels.edit}
              </Link>

              <DeleteBundleButton
                locale={locale}
                bundleId={bundle.id}
                labels={labels}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Cover({ bundle }: { bundle: BundleSummary }) {
  const url = bundle.image?.object_key ? publicUrl(bundle.image.object_key) : null;

  return (
    <span className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg border border-hairline bg-hairline">
      {url ? (
        <Image src={url} alt="" fill sizes="56px" className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-faint">
          <Icon path={icons.bundle} className="h-5 w-5" strokeWidth={1.5} />
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
  labels: Dictionary["dashboard"]["bundles"];
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
