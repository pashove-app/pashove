import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GiftClaimForm } from "@/components/gifts/gift-claim-form";
import { GiftBadge, GiftShell } from "@/components/gifts/gift-shell";
import { Icon, icons } from "@/components/ui/primitives";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import { getCustomerUser } from "@/lib/customer/queries";
import { getGiftCopy } from "@/lib/gifts/copy";
import { getGiftClaimInfo } from "@/lib/gifts/queries";
import { publicUrl } from "@/lib/r2/media";
import { PAYOUT_COUNTRIES } from "@/lib/finance/providers";
import { generateServiceSlots } from "@/lib/storefront/service-slots";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function formatDate(value: string, tag: string): string {
  return new Intl.DateTimeFormat(tag, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Abidjan",
  }).format(new Date(value));
}

export default async function GiftClaimPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale: raw, token } = await params;
  const locale = resolveLocale(raw);
  const tag = LOCALE_META[locale].tag;
  const copy = getGiftCopy(locale);
  const info = await getGiftClaimInfo(token);

  if (!info) notFound();
  if (info.status === "claimed") {
    redirect(`/${locale}/gift/claimed/${token}`);
  }

  const t = await getDictionary(locale);
  const user = await getCustomerUser();
  const booked = new Set(info.bookedSlots);
  const slots = info.hasService
    ? generateServiceSlots(info.serviceDuration, booked, tag)
    : [];

  const accountHref = `/${locale}/store/${info.storeSlug}/account/register?next=${encodeURIComponent(
    `/${locale}/gift/claim/${token}`,
  )}`;

  return (
    <GiftShell>
      <div className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-[0_30px_80px_-50px_rgba(15,23,42,0.55)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-[#152A8F] px-6 py-9 text-white sm:px-9 sm:py-11">
          <div className="pointer-events-none absolute -end-12 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-white/70">
              {copy.claim.eyebrow}
            </p>
            <h1 className="mt-3 max-w-lg text-[1.75rem] font-medium leading-tight tracking-[-0.035em] sm:text-[2.25rem]">
              {copy.claim.giftFrom.replace("{buyer}", info.buyerName)}
            </h1>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-white/75">
              {copy.claim.forYou.replace("{recipient}", info.recipientName)}
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-9">
          <div className="flex items-center gap-3 border-b border-hairline pb-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-500/[0.12] text-[0.9375rem] font-semibold text-accent">
              {info.storeLogoKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={publicUrl(info.storeLogoKey)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                info.storeName.slice(0, 2).toUpperCase()
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[0.9375rem] font-medium text-fg">
                {info.storeName}
              </p>
              <p className="text-[0.75rem] text-subtle">
                {copy.claim.order} #{info.orderNumber}
              </p>
            </div>
            <GiftBadge
              tone={info.status === "pending" ? "pending" : "neutral"}
              label={
                info.status === "expired"
                  ? copy.merchant.expired
                  : info.status === "cancelled"
                    ? copy.merchant.cancelled
                    : copy.merchant.pending
              }
            />
          </div>

          <div className="mt-6 space-y-3">
            {info.items.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-bg/40 p-3.5"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-hairline text-faint">
                  {item.imageKey ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={publicUrl(item.imageKey)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Icon path={icons.gift} className="h-5 w-5" strokeWidth={1.6} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9375rem] font-medium text-fg">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] text-subtle">
                    {item.variantLabel ? `${item.variantLabel} · ` : ""}
                    × {item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {info.message ? (
            <blockquote className="mt-6 border-l-2 border-brand-500 ps-4">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">
                {copy.claim.messageTitle}
              </p>
              <p className="mt-2 text-[0.9375rem] italic leading-relaxed text-body">
                “{info.message}”
              </p>
            </blockquote>
          ) : null}

          {info.scheduledAt > new Date().toISOString() ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-hairline px-3.5 py-2 text-[0.75rem] font-medium text-subtle">
              <Icon path={icons.calendar} className="h-3.5 w-3.5" strokeWidth={1.8} />
              {copy.claim.scheduled.replace("{date}", formatDate(info.scheduledAt, tag))}
            </p>
          ) : null}

          <div className="mt-7">
            {info.status === "expired" ? (
              <StatusPanel
                title={copy.claim.expiredTitle}
                text={copy.claim.expiredText}
                tone="expired"
              />
            ) : info.status === "cancelled" ? (
              <StatusPanel
                title={copy.claim.cancelledTitle}
                text={copy.claim.cancelledText}
                tone="expired"
              />
            ) : !info.canClaim ? (
              <StatusPanel
                title={copy.claim.notReadyTitle}
                text={copy.claim.notReadyText.replace(
                  "{date}",
                  formatDate(info.scheduledAt, tag),
                )}
                tone="pending"
              />
            ) : (
              <GiftClaimForm
                token={token}
                locale={locale}
                info={info}
                slots={slots}
                copy={copy}
                countries={PAYOUT_COUNTRIES.map((code) => ({
                  code,
                  label:
                    t.countries_names[
                      code as keyof Dictionary["countries_names"]
                    ] ?? code,
                }))}
                loggedIn={Boolean(user)}
                accountHref={accountHref}
              />
            )}
          </div>

          <div className="mt-8 border-t border-hairline pt-5 text-center">
            <Link
              href={`/${locale}/store/${info.storeSlug}`}
              className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-accent hover:underline"
            >
              {copy.success.backToStore}
              <Icon path={icons.arrowRight} className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </GiftShell>
  );
}

function StatusPanel({
  title,
  text,
  tone,
}: {
  title: string;
  text: string;
  tone: "expired" | "pending";
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        tone === "expired"
          ? "border-red-400/25 bg-red-400/[0.06]"
          : "border-amber-400/25 bg-amber-400/[0.06]"
      }`}
    >
      <p className="text-[0.9375rem] font-medium text-fg">{title}</p>
      <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-subtle">
        {text}
      </p>
    </div>
  );
}
