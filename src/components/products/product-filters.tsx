import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import type {
  ProductCounts,
  ProductStatusFilter,
} from "@/lib/products/queries";

/**
 * Recherche, onglets de statut et étiquettes.
 *
 * Tout passe par l'URL : la liste reste rendue côté serveur, partageable et
 * rechargée sans état client.
 */
export function ProductFilters({
  t,
  locale,
  q,
  status,
  tag,
  tags,
  counts,
}: {
  t: Dictionary;
  locale: Locale;
  q: string;
  status: ProductStatusFilter;
  tag: string;
  tags: string[];
  counts: ProductCounts;
}) {
  const labels = t.dashboard.products;

  const href = (next: {
    q?: string;
    status?: ProductStatusFilter;
    tag?: string;
  }) => {
    const params = new URLSearchParams();
    const nextQ = next.q ?? q;
    const nextStatus = next.status ?? status;
    const nextTag = next.tag !== undefined ? next.tag : tag;

    if (nextQ) params.set("q", nextQ);
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (nextTag) params.set("tag", nextTag);

    const query = params.toString();
    return path(locale, `/app/products${query ? `?${query}` : ""}`);
  };

  const tabs: { key: ProductStatusFilter; label: string; count: number }[] = [
    { key: "all", label: labels.tabAll, count: counts.all },
    { key: "published", label: labels.tabPublished, count: counts.published },
    { key: "draft", label: labels.tabDraft, count: counts.draft },
    { key: "out_of_stock", label: labels.tabOutOfStock, count: counts.outOfStock },
  ];

  return (
    <div className="mt-6">
      <form action={path(locale, "/app/products")} className="relative">
        {status !== "all" ? (
          <input type="hidden" name="status" value={status} />
        ) : null}
        {tag ? <input type="hidden" name="tag" value={tag} /> : null}

        <Icon
          path={icons.search}
          className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          strokeWidth={2}
        />

        <input
          name="q"
          defaultValue={q}
          placeholder={labels.searchPlaceholder}
          aria-label={labels.searchLabel}
          maxLength={80}
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-border bg-surface ps-10 pe-10 text-[0.875rem] text-fg placeholder:text-faint transition-[border-color,box-shadow] duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
        />

        {q ? (
          <Link
            href={href({ q: "" })}
            aria-label={labels.clearSearch}
            title={labels.clearSearch}
            className="absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-faint transition-colors hover:bg-hairline hover:text-fg"
          >
            <Icon path={icons.close} className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        ) : null}

        <button type="submit" className="sr-only">
          {labels.searchLabel}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {tabs.map((tab) => {
          const active = status === tab.key;

          return (
            <Link
              key={tab.key}
              href={href({ status: tab.key })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
                active
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-border text-subtle hover:border-border-strong hover:text-fg",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[0.6875rem] tabular-nums",
                  active ? "bg-white/20 text-white" : "bg-hairline text-faint",
                )}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="me-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
            {labels.tagFilter}
          </span>

          <Link
            href={href({ tag: "" })}
            aria-current={!tag ? "true" : undefined}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[0.75rem] transition-colors",
              !tag
                ? "border-border-strong bg-hairline text-fg"
                : "border-transparent text-subtle hover:text-fg",
            )}
          >
            {labels.allTags}
          </Link>

          {tags.map((entry) => {
            const active = tag === entry;

            return (
              <Link
                key={entry}
                href={href({ tag: active ? "" : entry })}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[0.75rem] transition-colors",
                  active
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border text-subtle hover:border-border-strong hover:text-fg",
                )}
              >
                {entry}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
