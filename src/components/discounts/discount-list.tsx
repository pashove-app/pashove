import { toggleDiscountAction } from "@/lib/discounts/actions";
import {
  discountStatus,
  type DiscountRow,
  type DiscountStatus,
} from "@/lib/discounts/queries";
import { Icon, icons } from "@/components/ui/primitives";
import type { Locale } from "@/i18n/config";
import { LOCALE_META } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/cn";

const STATUS_STYLE: Record<DiscountStatus, string> = {
  active:
    "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  scheduled: "bg-brand-500/10 text-accent",
  expired: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  inactive: "bg-hairline text-faint",
};

const STATUS_KEY: Record<DiscountStatus, keyof Dictionary["dashboard"]["discounts"]> = {
  active: "statusActive",
  scheduled: "statusScheduled",
  expired: "statusExpired",
  inactive: "statusInactive",
};

function StatusBadge({
  status,
  labels,
}: {
  status: DiscountStatus;
  labels: Dictionary["dashboard"]["discounts"];
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold",
        STATUS_STYLE[status],
      )}
    >
      {labels[STATUS_KEY[status]] as string}
    </span>
  );
}

/** Liste des codes promo : tableau desktop, cartes mobile. */
export function DiscountList({
  t,
  locale,
  currency,
  discounts,
}: {
  t: Dictionary;
  locale: Locale;
  currency: string;
  discounts: DiscountRow[];
}) {
  const labels = t.dashboard.discounts;
  const tag = LOCALE_META[locale].tag;

  const money = (amount: number) => formatMoney(amount, currency, tag);
  const date = (value: string) =>
    new Intl.DateTimeFormat(tag, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));

  const valueLabel = (discount: DiscountRow) =>
    discount.kind === "percent"
      ? `${discount.value} %`
      : money(discount.value);

  const conditions = (discount: DiscountRow) => {
    const parts: string[] = [];

    parts.push(
      discount.min_subtotal > 0
        ? labels.minSubtotal.replace("{amount}", money(discount.min_subtotal))
        : labels.minSubtotalNone,
    );

    parts.push(
      discount.max_uses === null
        ? labels.usesUnlimited
        : labels.usesLabel
            .replace("{used}", String(discount.uses_count))
            .replace("{max}", String(discount.max_uses)),
    );

    return parts;
  };

  return (
    <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-surface">
      <table className="hidden w-full md:table">
        <thead>
          <tr className="border-b border-border text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
            <th className="px-5 py-3 text-start">Code</th>
            <th className="px-4 py-3 text-start">{labels.columnValue}</th>
            <th className="px-4 py-3 text-start">{labels.columnConditions}</th>
            <th className="px-4 py-3 text-start">{labels.columnDates}</th>
            <th className="px-4 py-3 text-start">{labels.columnStatus}</th>
            <th className="px-5 py-3 text-end" aria-label={labels.columnStatus} />
          </tr>
        </thead>

        <tbody>
          {discounts.map((discount) => {
            const status = discountStatus(discount);

            return (
              <tr
                key={discount.id}
                className="border-b border-border transition-colors last:border-0 hover:bg-hairline/30"
              >
                <td className="px-5 py-4">
                  <p className="font-mono text-[0.875rem] font-semibold tracking-wide text-fg">
                    {discount.code}
                  </p>
                  <p className="mt-0.5 text-[0.6875rem] text-faint">
                    {discount.kind === "percent"
                      ? labels.typePercent
                      : labels.typeFixed.replace("{currency}", currency)}
                  </p>
                </td>

                <td className="px-4 py-4 text-[0.875rem] font-medium tabular-nums text-fg">
                  −{valueLabel(discount)}
                </td>

                <td className="px-4 py-4">
                  <ul className="space-y-0.5 text-[0.75rem] text-subtle">
                    {conditions(discount).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </td>

                <td className="px-4 py-4 text-[0.75rem] text-subtle">
                  <p>
                    {labels.startsAt} ·{" "}
                    {discount.starts_at ? date(discount.starts_at) : labels.noDate}
                  </p>
                  <p className="mt-0.5">
                    {labels.expiresAt} ·{" "}
                    {discount.expires_at ? date(discount.expires_at) : labels.noDate}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <StatusBadge status={status} labels={labels} />
                </td>

                <td className="px-5 py-4 text-end">
                  <ToggleButton
                    discount={discount}
                    locale={locale}
                    labels={labels}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden">
        {discounts.map((discount) => {
          const status = discountStatus(discount);

          return (
            <li key={discount.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[0.9375rem] font-semibold tracking-wide text-fg">
                    {discount.code}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] text-subtle">
                    {labels.reductionOf.replace("{value}", valueLabel(discount))}
                  </p>
                </div>
                <StatusBadge status={status} labels={labels} />
              </div>

              <ul className="mt-3 space-y-1 text-[0.75rem] text-subtle">
                {conditions(discount).map((line) => (
                  <li key={line} className="flex items-center gap-2">
                    <Icon
                      path={icons.check}
                      className="h-3.5 w-3.5 shrink-0 text-faint"
                      strokeWidth={2}
                    />
                    {line}
                  </li>
                ))}
                <li className="flex items-center gap-2">
                  <Icon
                    path={icons.calendar}
                    className="h-3.5 w-3.5 shrink-0 text-faint"
                    strokeWidth={2}
                  />
                  {discount.expires_at
                    ? `${labels.expiresAt} · ${date(discount.expires_at)}`
                    : labels.noExpiry}
                </li>
              </ul>

              <div className="mt-4">
                <ToggleButton discount={discount} locale={locale} labels={labels} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ToggleButton({
  discount,
  locale,
  labels,
}: {
  discount: DiscountRow;
  locale: Locale;
  labels: Dictionary["dashboard"]["discounts"];
}) {
  return (
    <form action={toggleDiscountAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="id" value={discount.id} />
      <input type="hidden" name="active" value={String(!discount.active)} />
      <button
        type="submit"
        className="inline-flex h-9 items-center justify-center rounded-full border border-border px-3.5 text-[0.75rem] font-medium text-subtle transition-colors hover:border-border-strong hover:text-fg"
      >
        {discount.active ? labels.deactivate : labels.activate}
      </button>
    </form>
  );
}
