import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GiftBadge, GiftShell } from "@/components/gifts/gift-shell";
import { Icon, icons } from "@/components/ui/primitives";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getGiftCopy } from "@/lib/gifts/copy";
import { downloadGiftFileAction } from "@/lib/gifts/actions";
import { getGiftClaimInfo } from "@/lib/gifts/queries";
import { publicUrl } from "@/lib/r2/media";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function GiftClaimedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ download?: string }>;
}) {
  const { locale: raw, token } = await params;
  const { download } = await searchParams;
  const locale = resolveLocale(raw);
  const tag = LOCALE_META[locale].tag;
  const copy = getGiftCopy(locale);
  const info = await getGiftClaimInfo(token);

  if (!info) notFound();
  if (info.status !== "claimed") {
    redirect(`/${locale}/gift/claim/${token}`);
  }

  return (
    <GiftShell>
      <div className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-[0_30px_80px_-50px_rgba(15,23,42,0.55)]">
        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-[#0F5132] px-6 py-9 text-white sm:px-9 sm:py-11">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Icon path={icons.check} className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <h1 className="mt-5 text-[1.75rem] font-medium tracking-[-0.035em] sm:text-[2.25rem]">
            {copy.success.title}
          </h1>
          <p className="mt-2 max-w-lg text-[0.9375rem] leading-relaxed text-white/80">
            {copy.success.text.replace("{store}", info.storeName)}
          </p>
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
            <GiftBadge label={copy.merchant.claimed} tone="success" />
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

          {info.hasDigital ? (
            <section className="mt-7 rounded-2xl border border-border bg-bg/40 p-5">
              <h2 className="text-[0.9375rem] font-medium text-fg">
                {copy.success.downloadsTitle}
              </h2>

              {download === "error" ? (
                <p className="mt-3 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-red-600 dark:text-red-400">
                  {copy.claim.errorGeneric}
                </p>
              ) : null}

              <div className="mt-4 space-y-2">
                {info.digitalItems.map((item) => (
                  <form
                    key={item.entitlementId}
                    action={downloadGiftFileAction}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5"
                  >
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="token" value={token} />
                    <input
                      type="hidden"
                      name="entitlementId"
                      value={item.entitlementId}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[0.8125rem] font-medium text-fg">
                        {item.productName}
                      </p>
                      <p className="mt-0.5 text-[0.6875rem] text-subtle">
                        {item.remaining > 0
                          ? `${item.remaining} téléchargement${item.remaining > 1 ? "s" : ""} restant${item.remaining > 1 ? "s" : ""}`
                          : "Quota atteint"}
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={item.remaining <= 0}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-500 px-4 text-[0.75rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Icon path={icons.download} className="h-3.5 w-3.5" strokeWidth={1.9} />
                      {copy.success.download}
                    </button>
                  </form>
                ))}

                {info.digitalItems.length === 0 ? (
                  <p className="text-[0.8125rem] text-subtle">
                    {copy.success.noDownload}
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          {info.hasPhysical ? (
            <p className="mt-6 rounded-2xl border border-border bg-bg/40 px-4 py-3 text-[0.8125rem] leading-relaxed text-subtle">
              {copy.success.addressTitle} : {info.storeName} a reçu l’adresse de
              livraison. Tu seras contacté pour la livraison.
            </p>
          ) : null}

          {info.claimedAt ? (
            <p className="mt-6 text-[0.75rem] text-faint">
              {copy.success.claimedBy.replace("{name}", info.recipientName)} ·{" "}
              {new Intl.DateTimeFormat(tag, {
                dateStyle: "long",
                timeStyle: "short",
                timeZone: "Africa/Abidjan",
              }).format(new Date(info.claimedAt))}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3 border-t border-hairline pt-5">
            <Link
              href={`/${locale}/store/${info.storeSlug}`}
              className="inline-flex h-11 items-center rounded-full bg-brand-500 px-5 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-600"
            >
              {copy.success.backToStore}
            </Link>
            <Link
              href={`/${locale}/store/${info.storeSlug}/account/downloads`}
              className="inline-flex h-11 items-center rounded-full border border-border px-5 text-[0.8125rem] font-medium text-body transition-colors hover:border-border-strong"
            >
              {copy.success.seeAccount}
            </Link>
          </div>
        </div>
      </div>
    </GiftShell>
  );
}
