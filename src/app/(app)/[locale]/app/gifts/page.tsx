import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GiftSettingsForm } from "@/components/gifts/gift-settings-form";
import { Icon, icons } from "@/components/ui/primitives";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getGiftCopy } from "@/lib/gifts/copy";
import { listReceivedGifts, listSentGifts } from "@/lib/gifts/queries";
import type { GiftStatus, MerchantGift, ReceivedGift } from "@/lib/gifts/types";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const copy = getGiftCopy(locale);

  return { title: copy.merchant.title };
}

function formatDate(value: string, tag: string): string {
  return new Intl.DateTimeFormat(tag, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Abidjan",
  }).format(new Date(value));
}

function statusLabel(status: GiftStatus, copy: ReturnType<typeof getGiftCopy>) {
  if (status === "claimed") return copy.merchant.claimed;
  if (status === "expired") return copy.merchant.expired;
  if (status === "cancelled") return copy.merchant.cancelled;
  return copy.merchant.pending;
}

function statusClass(status: GiftStatus): string {
  if (status === "claimed") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-400";
  }
  if (status === "pending") {
    return "border-amber-400/30 bg-amber-400/10 text-amber-600 dark:text-amber-400";
  }
  return "border-border bg-hairline text-subtle";
}

export default async function GiftsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale: raw } = await params;
  const { tab: rawTab } = await searchParams;
  const locale = resolveLocale(raw);
  const tag = LOCALE_META[locale].tag;
  const copy = getGiftCopy(locale);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const tab =
    rawTab === "received" || rawTab === "settings" ? rawTab : "sent";

  const [sent, received] = await Promise.all([
    listSentGifts(store.id),
    listReceivedGifts(),
  ]);

  const t = await getDictionary(locale);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
          {t.dashboard.nav.gifts}
        </p>
        <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.035em] text-fg sm:text-[2rem]">
          {copy.merchant.title}
        </h1>
        <p className="mt-1.5 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
          {copy.merchant.subtitle}
        </p>
      </header>

      <nav className="mt-6 flex flex-wrap gap-2">
        {[
          { key: "sent", label: copy.merchant.tabSent, count: sent.length },
          {
            key: "received",
            label: copy.merchant.tabReceived,
            count: received.length,
          },
          { key: "settings", label: copy.merchant.tabSettings, count: null },
        ].map((item) => {
          const active = tab === item.key;
          const href = `/${locale}/app/gifts${item.key === "sent" ? "" : `?tab=${item.key}`}`;

          return (
            <Link
              key={item.key}
              href={href}
              className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[0.75rem] font-medium transition-colors ${
                active
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-border text-subtle hover:border-border-strong hover:text-fg"
              }`}
            >
              {item.label}
              {item.count !== null ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[0.625rem] ${
                    active ? "bg-white/15" : "bg-hairline"
                  }`}
                >
                  {item.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {tab === "sent" ? (
        <div className="mt-5 space-y-3">
          {sent.length === 0 ? (
            <Empty text={copy.merchant.emptySent} />
          ) : (
            sent.map((gift) => (
              <SentCard
                key={gift.id}
                gift={gift}
                locale={locale}
                tag={tag}
                copy={copy}
              />
            ))
          )}
        </div>
      ) : null}

      {tab === "received" ? (
        <div className="mt-5 space-y-3">
          {received.length === 0 ? (
            <Empty text={copy.merchant.emptyReceived} />
          ) : (
            received.map((gift) => (
              <ReceivedCard
                key={gift.id}
                gift={gift}
                locale={locale}
                tag={tag}
                copy={copy}
              />
            ))
          )}
        </div>
      ) : null}

      {tab === "settings" ? (
        <section className="mt-5 rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/[0.12] text-accent">
              <Icon path={icons.gift} className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="text-[1rem] font-medium text-fg">
                {copy.merchant.settingsTitle}
              </h2>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
                {copy.merchant.settingsText}
              </p>
            </div>
          </div>

          <GiftSettingsForm
            locale={locale}
            enabled={store.gift_enabled}
            copy={copy}
          />
        </section>
      ) : null}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-surface/50 px-5 py-12 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-hairline text-faint">
        <Icon path={icons.gift} className="h-5 w-5" strokeWidth={1.7} />
      </span>
      <p className="mt-4 text-[0.875rem] text-subtle">{text}</p>
    </div>
  );
}

function ItemLine({
  items,
  copy,
}: {
  items: MerchantGift["items"];
  copy: ReturnType<typeof getGiftCopy>;
}) {
  if (items.length === 0) {
    return <p className="text-[0.75rem] text-faint">{copy.merchant.noItems}</p>;
  }

  return (
    <p className="truncate text-[0.75rem] text-subtle">
      {items[0].name}
      {items.length > 1 ? ` + ${items.length - 1}` : ""}
    </p>
  );
}

function SentCard({
  gift,
  locale,
  tag,
  copy,
}: {
  gift: MerchantGift;
  locale: string;
  tag: string;
  copy: ReturnType<typeof getGiftCopy>;
}) {
  return (
    <article className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-faint">
            {copy.merchant.sentFor.replace("{name}", gift.recipientName)}
          </p>
          <p className="mt-1 text-[0.9375rem] font-medium text-fg">
            {gift.recipientEmail}
          </p>
          <ItemLine items={gift.items} copy={copy} />
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.625rem] font-medium ${statusClass(gift.status)}`}
        >
          {statusLabel(gift.status, copy)}
        </span>
      </div>

      <dl className="mt-4 grid gap-2 border-t border-hairline pt-4 text-[0.75rem] sm:grid-cols-2">
        <div className="flex justify-between gap-3">
          <dt className="text-faint">{copy.merchant.buyer}</dt>
          <dd className="text-body">{gift.buyerName ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-faint">{copy.merchant.scheduled}</dt>
          <dd className="text-body">{formatDate(gift.scheduledAt, tag)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-faint">{copy.claim.order}</dt>
          <dd className="text-body">#{gift.orderNumber ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-faint">{copy.merchant.recipient}</dt>
          <dd className="text-body">{gift.recipientName}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/${locale}/gift/claim/${gift.token}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-[0.75rem] font-medium text-body transition-colors hover:border-border-strong"
        >
          <Icon path={icons.arrowUpRight} className="h-3.5 w-3.5" strokeWidth={1.9} />
          {copy.merchant.openLink}
        </Link>
        {gift.orderId ? (
          <Link
            href={`/${locale}/app/orders/${gift.orderId}`}
            className="inline-flex h-9 items-center rounded-full px-4 text-[0.75rem] font-medium text-accent transition-colors hover:bg-brand-500/10"
          >
            {copy.claim.order} #{gift.orderNumber}
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function ReceivedCard({
  gift,
  locale,
  tag,
  copy,
}: {
  gift: ReceivedGift;
  locale: string;
  tag: string;
  copy: ReturnType<typeof getGiftCopy>;
}) {
  return (
    <article className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-faint">
            {gift.storeName}
          </p>
          <p className="mt-1 text-[0.9375rem] font-medium text-fg">
            {gift.items[0]?.name ?? copy.merchant.noItems}
          </p>
          <p className="mt-0.5 text-[0.75rem] text-subtle">
            × {gift.items[0]?.quantity ?? 1} · #{gift.orderNumber ?? "—"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.625rem] font-medium ${statusClass(gift.status)}`}
        >
          {statusLabel(gift.status, copy)}
        </span>
      </div>

      <p className="mt-3 text-[0.75rem] text-subtle">
        {copy.merchant.scheduled} · {formatDate(gift.scheduledAt, tag)}
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/${locale}/gift/claim/${gift.token}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-500 px-4 text-[0.75rem] font-medium text-white transition-colors hover:bg-brand-600"
        >
          {copy.merchant.openLink}
        </Link>
        <Link
          href={`/${locale}/store/${gift.storeSlug}`}
          className="inline-flex h-9 items-center rounded-full border border-border px-4 text-[0.75rem] font-medium text-body transition-colors hover:border-border-strong"
        >
          {gift.storeName}
        </Link>
      </div>
    </article>
  );
}
