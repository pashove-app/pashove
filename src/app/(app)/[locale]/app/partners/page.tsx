import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  addPartnerListingAction,
  createAffiliateLinkAction,
} from "@/lib/partners/actions";
import { CopyLink } from "@/components/partners/copy-link";
import {
  listAffiliateLinks,
  listDiscoverOffers,
  listPartnerListings,
  listPartnerSales,
} from "@/lib/partners/queries";
import { publicUrl } from "@/lib/r2/media";
import {
  canManageCatalog,
  currentMembership,
} from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.partners.title };
}

/** Découverte des produits partagés et suivi des ventes partenaires. */
export default async function PartnersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ added?: string; error?: string; affiliate?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const { added, error, affiliate } = await searchParams;

  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);
  const labels = t.dashboard.partners;
  const tag = LOCALE_META[locale].tag;
  const store = membership.store;
  const canAdd = canManageCatalog(membership.role);

  const [offers, listings, sales, affiliateLinks] = await Promise.all([
    listDiscoverOffers(store.id, store.currency, tag),
    listPartnerListings(store.id, store.currency, tag),
    listPartnerSales(store.id, store.currency, tag),
    listAffiliateLinks(store.id, store.currency, tag),
  ]);

  const activeAffiliate = affiliate
    ? affiliateLinks.find((link) => link.code === affiliate)
    : null;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const affiliateUrl = activeAffiliate
    ? `${appUrl}/${locale}/store/${activeAffiliate.ownerStoreSlug}?ref=${activeAffiliate.code}`
    : null;

  const errorMessage = error
    ? labels.errors[error as keyof typeof labels.errors] ?? labels.errors.serverError
    : null;

  const statusLabel = (status: string) =>
    status === "approved"
      ? labels.statusApproved
      : status === "paid"
        ? labels.statusPaid
        : status === "reversed"
          ? labels.statusReversed
          : labels.statusPending;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div>
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {labels.title}
        </h1>
        <p className="mt-1 max-w-xl text-[0.875rem] leading-relaxed text-muted">
          {labels.subtitle}
        </p>
      </div>

      {added ? (
        <p
          role="status"
          className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-3 text-[0.8125rem] text-emerald-700 dark:text-emerald-300"
        >
          <Icon path={icons.check} className="h-4 w-4" strokeWidth={2.4} />
          {labels.added}
        </p>
      ) : null}

      {errorMessage ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3.5 py-3 text-[0.8125rem] text-red-600 dark:text-red-400"
        >
          {errorMessage}
        </p>
      ) : null}

      {affiliateUrl ? (
        <div className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
          <p className="text-[0.8125rem] font-medium text-emerald-700 dark:text-emerald-300">
            {labels.affiliateReady}
          </p>
          <div className="mt-2">
            <CopyLink
              url={affiliateUrl}
              copyLabel={labels.affiliateCopy}
              copiedLabel={labels.affiliateCopied}
            />
          </div>
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="text-[1.0625rem] font-medium text-fg">
          {labels.discoverTitle}
        </h2>
        <p className="mt-0.5 text-[0.8125rem] text-subtle">
          {labels.discoverSubtitle}
        </p>

        {offers.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-border bg-surface px-6 py-12 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/[0.12] text-accent">
              <Icon path={icons.route} className="h-5 w-5" strokeWidth={1.7} />
            </span>
            <p className="mt-4 text-[0.9375rem] font-medium text-fg">
              {labels.discoverEmpty}
            </p>
            <p className="mt-1 text-[0.8125rem] text-subtle">
              {labels.discoverEmptyText}
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <article
                key={offer.offerId}
                className="overflow-hidden rounded-3xl border border-border bg-surface"
              >
                <div className="relative aspect-[16/10] bg-hairline">
                  {offer.imageKey ? (
                    <Image
                      src={publicUrl(offer.imageKey)}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : null}
                  <span className="absolute start-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[0.6875rem] font-semibold text-white">
                    {labels.percent.replace(
                      "{value}",
                      String(offer.commissionBps / 100),
                    )}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="truncate text-[0.9375rem] font-medium text-fg">
                    {offer.name}
                  </h3>
                  <p className="mt-0.5 truncate text-[0.75rem] text-subtle">
                    {labels.sourceStore} · {offer.storeName}
                  </p>

                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[0.625rem] uppercase tracking-[0.12em] text-faint">
                        {labels.price}
                      </p>
                      <p className="text-[0.9375rem] font-semibold tabular-nums text-fg">
                        {offer.priceLabel}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-[0.625rem] uppercase tracking-[0.12em] text-faint">
                        {labels.commission}
                      </p>
                      <p className="text-[0.9375rem] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {offer.commissionLabel}
                      </p>
                    </div>
                  </div>

                  <details className="mt-3 rounded-2xl border border-border bg-bg px-3 py-2.5">
                    <summary className="cursor-pointer text-[0.75rem] font-medium text-accent">
                      {labels.offerDetails}
                    </summary>
                    <dl className="mt-2 space-y-1.5 text-[0.6875rem]">
                      <div className="flex justify-between gap-3">
                        <dt className="text-subtle">{labels.offerSales}</dt>
                        <dd className="tabular-nums text-fg">{offer.salesCount}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-subtle">{labels.offerCreated}</dt>
                        <dd className="text-fg">
                          {new Intl.DateTimeFormat(tag, { dateStyle: "medium" }).format(
                            new Date(offer.createdAt),
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-subtle">{labels.offerCreator}</dt>
                        <dd className="truncate text-fg">{offer.storeName}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-subtle">{labels.offerForecast}</dt>
                        <dd className="font-medium text-emerald-600 dark:text-emerald-400">
                          {offer.commissionLabel}
                        </dd>
                      </div>
                    </dl>
                  </details>

                  {canAdd ? (
                    <>
                      <form action={addPartnerListingAction} className="mt-4">
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="offerId" value={offer.offerId} />
                        <button
                          type="submit"
                          className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-brand-500 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-600"
                        >
                          <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
                          {labels.add}
                        </button>
                      </form>

                      <form action={createAffiliateLinkAction} className="mt-2">
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="offerId" value={offer.offerId} />
                        <button
                          type="submit"
                          className="flex h-9 w-full items-center justify-center gap-2 rounded-full border border-border text-[0.75rem] font-medium text-body transition-colors hover:border-border-strong hover:text-fg"
                        >
                          <Icon path={icons.route} className="h-3.5 w-3.5" strokeWidth={2} />
                          {labels.affiliateGenerate}
                        </button>
                      </form>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-[1.0625rem] font-medium text-fg">
          {labels.myListingsTitle}
        </h2>

        {listings.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-border bg-surface px-5 py-6 text-[0.8125rem] text-subtle">
            {labels.myListingsEmpty} — {labels.myListingsEmptyText}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-hairline overflow-hidden rounded-3xl border border-border bg-surface">
            {listings.map((listing) => (
              <li
                key={listing.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.875rem] font-medium text-fg">
                    {listing.name}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] text-subtle">
                    {labels.sourceStore} · {listing.sourceStoreName}
                  </p>
                </div>
                <p className="text-[0.875rem] font-medium tabular-nums text-fg">
                  {listing.priceLabel}
                </p>
                <Link
                  href={path(locale, `/app/products/${listing.id}`)}
                  className="inline-flex h-8 items-center rounded-full border border-border px-3 text-[0.75rem] font-medium text-subtle transition-colors hover:border-border-strong hover:text-fg"
                >
                  {labels.open}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-[1.0625rem] font-medium text-fg">
          {labels.affiliateTitle}
        </h2>
        <p className="mt-0.5 text-[0.8125rem] text-subtle">
          {labels.affiliateSubtitle}
        </p>

        {affiliateLinks.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-border bg-surface px-5 py-6 text-[0.8125rem] text-subtle">
            {labels.affiliateEmpty}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-hairline overflow-hidden rounded-3xl border border-border bg-surface">
            {affiliateLinks.map((link) => (
              <li key={link.id} className="px-5 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[0.875rem] font-medium text-fg">
                      {link.productName}
                    </p>
                    <p className="mt-0.5 font-mono text-[0.75rem] text-subtle">
                      ?ref={link.code}
                    </p>
                  </div>
                  <div className="flex gap-4 text-end text-[0.75rem]">
                    <div>
                      <p className="text-faint">{labels.affiliateSales}</p>
                      <p className="font-medium tabular-nums text-fg">
                        {link.salesCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-faint">{labels.affiliateEarned}</p>
                      <p className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                        {link.earnedLabel}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-[1.0625rem] font-medium text-fg">
          {labels.salesTitle}
        </h2>

        {sales.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-border bg-surface px-5 py-6 text-[0.8125rem] text-subtle">
            {labels.salesEmpty}
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-3xl border border-border bg-surface">
            <ul className="divide-y divide-hairline">
              {sales.map((sale) => (
                <li key={sale.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.875rem] font-medium text-fg">
                        #{sale.orderNumber} · {sale.sourceStoreName}
                      </p>
                      <p className="mt-0.5 text-[0.75rem] text-subtle">
                        {sale.sourceStoreName} → {sale.partnerStoreName} ·{" "}
                        {sale.amountLabel}
                      </p>
                    </div>
                    <span className="rounded-full bg-hairline px-2.5 py-1 text-[0.6875rem] font-medium text-subtle">
                      {statusLabel(sale.status)}
                    </span>
                  </div>

                  <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[0.75rem]">
                    <div>
                      <dt className="inline text-faint">{labels.sourceRevenue} </dt>
                      <dd className="inline font-medium tabular-nums text-body">
                        {sale.sourceRevenueLabel}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-faint">{labels.commission} </dt>
                      <dd className="inline font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                        {sale.partnerCommissionLabel}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-faint">{labels.platformFee} </dt>
                      <dd className="inline font-medium tabular-nums text-body">
                        {sale.platformCommissionLabel}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
