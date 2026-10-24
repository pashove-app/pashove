import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CollectionList } from "@/components/collections/collection-list";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { listCollections } from "@/lib/collections/queries";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.collections.title };
}

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Liste des collections de la boutique. */
export default async function CollectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    q?: string;
  }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const {
    created,
    updated,
    deleted,
    q: rawQuery,
  } = await searchParams;

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);
  const labels = t.dashboard.collections;

  const q = typeof rawQuery === "string" ? rawQuery.slice(0, 80) : "";
  const all = await listCollections(store.id);

  const needle = fold(q.trim());
  const collections = needle
    ? all.filter(
        (collection) =>
          fold(collection.name).includes(needle) ||
          fold(collection.slug).includes(needle),
      )
    : all;

  const count = all.length;
  const countLabel = (count === 1 ? labels.count : labels.countPlural).replace(
    "{count}",
    String(count),
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            {labels.title}
          </h1>
          <p className="mt-1 text-[0.875rem] text-muted">{countLabel}</p>
        </div>

        <ButtonLink href={path(locale, "/app/collections/new")}>
          <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
          {labels.newCollection}
        </ButtonLink>
      </div>

      <p className="mt-2 hidden max-w-xl text-[0.875rem] leading-relaxed text-subtle sm:block">
        {labels.subtitle}
      </p>

      {created || updated || deleted ? (
        <p
          role="status"
          className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] p-3.5 text-[0.8125rem] leading-relaxed text-emerald-700 dark:text-emerald-300"
        >
          <Icon path={icons.check} className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
          {deleted
            ? labels.flashDeleted
            : updated
              ? labels.flashUpdated
              : labels.flashCreated}
        </p>
      ) : null}

      {all.length > 0 ? (
        <form action={path(locale, "/app/collections")} className="relative mt-6">
          <Icon
            path={icons.search}
            className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
            strokeWidth={2}
          />

          <input
            name="q"
            defaultValue={q}
            placeholder={labels.searchPlaceholder}
            aria-label={labels.searchPlaceholder}
            maxLength={80}
            autoComplete="off"
            className="h-11 w-full rounded-xl border border-border bg-surface ps-10 pe-10 text-[0.875rem] text-fg placeholder:text-faint transition-[border-color,box-shadow] duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
          />

          {q ? (
            <a
              href={path(locale, "/app/collections")}
              aria-label={labels.clearSearch}
              title={labels.clearSearch}
              className="absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-faint transition-colors hover:bg-hairline hover:text-fg"
            >
              <Icon path={icons.close} className="h-4 w-4" strokeWidth={2.2} />
            </a>
          ) : null}

          <button type="submit" className="sr-only">
            {labels.searchPlaceholder}
          </button>
        </form>
      ) : null}

      {collections.length === 0 ? (
        needle ? (
          <div className="mt-5 rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-[0.9375rem] font-medium text-fg">{labels.noResults}</p>
            <p className="mt-1 text-[0.8125rem] text-subtle">{labels.noResultsHint}</p>
            <ButtonLink
              href={path(locale, "/app/collections")}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              {labels.clearSearch}
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-border bg-surface px-6 py-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/[0.12] text-accent">
              <Icon path={icons.layers} className="h-6 w-6" strokeWidth={1.6} />
            </span>

            <h2 className="mt-5 text-[1.0625rem] font-medium text-fg">
              {labels.emptyTitle}
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-[0.875rem] leading-relaxed text-subtle">
              {labels.emptyText}
            </p>

            <ButtonLink
              href={path(locale, "/app/collections/new")}
              className="mt-5"
              size="sm"
            >
              <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
              {labels.emptyCta}
            </ButtonLink>
          </div>
        )
      ) : (
        <CollectionList t={t} locale={locale} collections={collections} />
      )}
    </div>
  );
}
