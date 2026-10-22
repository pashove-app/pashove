import { Container } from "@/components/storefront/container";
import { Icon, icons } from "@/components/ui/primitives";
import { LOCALE_META, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import type { PublicStore } from "@/lib/storefront/queries";

type Item = {
  icon: "box" | "wallet" | "chat" | "user";
  title: string;
  text: string;
};

/** Quatre promesses vérifiables, tirées des réglages de la boutique. */
export function TrustStrip({
  store,
  locale,
  t,
}: {
  store: PublicStore;
  locale: Locale;
  t: Dictionary;
}) {
  const labels = t.storefront;
  const price = formatMoney(
    store.shipping_flat_amount,
    store.currency,
    LOCALE_META[locale].tag,
  );

  const items: Item[] = [
    {
      icon: "box",
      title: labels.trustShippingTitle,
      text:
        store.shipping_flat_amount === 0
          ? labels.trustShippingFree
          : labels.trustShippingFlat.replace("{amount}", price),
    },
    ...(store.cod_enabled
      ? [{ icon: "wallet" as const, title: labels.codInfo, text: labels.trustCodText }]
      : []),
    {
      icon: "chat",
      title: labels.trustContactTitle,
      text: labels.trustContactText,
    },
    {
      icon: "user",
      title: labels.trustGuestTitle,
      text: labels.trustGuestText,
    },
  ];

  return (
    <Container className="-mt-8 sm:-mt-10">
      <div className="relative z-10 grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl border border-border bg-surface p-5 shadow-[0_24px_60px_rgba(15,20,30,0.08)] sm:grid-cols-4 sm:p-6">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-hairline text-accent">
              <Icon path={icons[item.icon]} className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="text-[0.75rem] font-medium leading-snug text-fg">
                {item.title}
              </p>
              <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-subtle">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
