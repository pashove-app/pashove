import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/storefront/container";
import { StorefrontClosed } from "@/components/storefront/storefront-closed";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { BackLink } from "@/components/ui/back-link";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { publicUrl } from "@/lib/r2/media";
import { getPublicBundle } from "@/lib/storefront/bundles";
import { loadStorefront } from "@/lib/storefront/queries";
import { LOCALE_META } from "@/i18n/config";
import { cn } from "@/lib/cn";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; bundleSlug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug, bundleSlug } = await params;
  if (!isLocale(raw)) return {};
  const locale = resolveLocale(raw);
  const { store } = await loadStorefront(slug);
  if (!store) return {};
  const bundle = await getPublicBundle(
    store.id,
    bundleSlug,
    store.currency,
    LOCALE_META[locale].tag,
  );
  if (!bundle) return {};

  return {
    title: `${bundle.name} · ${store.name}`,
    description: bundle.description?.slice(0, 160) ?? undefined,
  };
}

export default async function BundlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; bundleSlug: string }>;
}) {
  const { locale: raw, slug, bundleSlug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = resolveLocale(raw);

  const { status, store } = await loadStorefront(slug);
  if (status === "missing") notFound();
  const t = await getDictionary(locale);
  if (status === "suspended") return <StorefrontClosed t={t} />;
  if (!store) notFound();

  const bundle = await getPublicBundle(
    store.id,
    bundleSlug,
    store.currency,
    LOCALE_META[locale].tag,
  );
  if (!bundle) notFound();

  const coverUrl = bundle.image_key ? publicUrl(bundle.image_key) : null;

  return (
    <StorefrontShell store={store} locale={locale} t={t}>
      <StorefrontHeader store={store} locale={locale} t={t} />
      <main>
        <Container className="py-10 sm:py-14">
          <BackLink href={path(locale, `/store/${slug}`)} label={t.storefront.bundleBack} />

          <div
            className={cn(
              "mt-6 grid gap-6",
              coverUrl &&
                "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start",
            )}
          >
            {coverUrl ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-hairline">
                <Image
                  src={coverUrl}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ) : null}

            <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8">
              {coverUrl ? null : (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -end-8 -top-8 hidden text-brand-500/[0.09] sm:block"
                >
                  <Icon path={icons.bundle} className="h-56 w-56" strokeWidth={0.7} />
                </span>
              )}

              <div className="relative">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-subtle">
                  {t.storefront.bundlesTitle}
                </p>
                <h1 className="mt-2 text-[1.875rem] font-medium tracking-[-0.035em] text-fg sm:text-[2.5rem]">
                  {bundle.name}
                </h1>
                {bundle.description ? (
                  <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
                    {bundle.description}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-wrap items-end gap-3">
                  <p className="text-[1.75rem] font-semibold tabular-nums text-fg">
                    {bundle.priceLabel}
                  </p>
                  <p className="pb-1 text-[0.9375rem] tabular-nums text-faint line-through">
                    {bundle.sumLabel}
                  </p>
                  <span className="mb-1 rounded-full bg-emerald-500/12 px-2.5 py-1 text-[0.6875rem] font-semibold text-emerald-600 dark:text-emerald-400">
                    {t.storefront.bundleSave.replace("{amount}", bundle.savingsLabel)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-hairline text-[0.875rem] font-medium text-faint sm:w-auto sm:px-8"
                >
                  <Icon path={icons.lock} className="h-4 w-4" strokeWidth={1.9} />
                  {t.storefront.bundleSoon}
                </button>
                <p className="mt-2 text-center text-[0.75rem] text-faint sm:text-start">
                  {t.storefront.bundleSoonText}
                </p>
              </div>
            </div>
          </div>

          <section className="mt-8 rounded-3xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-[1.0625rem] font-medium text-fg">
              {t.storefront.bundleIncludes}
            </h2>
            <ul className="mt-4 divide-y divide-hairline">
              {bundle.items.map((item) => (
                <li key={`${item.slug}-${item.variantLabel ?? ""}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-hairline">
                    {item.image_key ? (
                      <Image
                        src={publicUrl(item.image_key)}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={path(locale, `/store/${slug}/products/${item.slug}`)}
                      className="line-clamp-2 text-[0.875rem] font-medium text-fg hover:text-accent"
                    >
                      {item.name}
                    </Link>
                    {item.variantLabel ? (
                      <p className="mt-0.5 text-[0.75rem] text-subtle">{item.variantLabel}</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-[0.8125rem] font-medium tabular-nums text-body">
                    {item.priceLabel}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </Container>
      </main>
    </StorefrontShell>
  );
}
