import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InventoryAdjustForm } from "@/components/inventory/inventory-adjust-form";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  createLocationAction,
  setDefaultLocationAction,
} from "@/lib/inventory/actions";
import {
  listInventoryLocations,
  listInventoryMovements,
  listInventoryProducts,
} from "@/lib/inventory/queries";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = {
  title: "Inventaire",
  robots: { index: false, follow: false },
};

const REASON_KEYS = {
  adjustment: "reasonAdjustment",
  restock: "reasonRestock",
  transfer: "reasonTransfer",
  initial: "reasonInitial",
  sale: "reasonAdjustment",
  refund: "reasonAdjustment",
} as const;

export default async function InventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { locale: raw } = await params;
  const { ok, error } = await searchParams;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const [products, locations, movements, t] = await Promise.all([
    listInventoryProducts(store.id),
    listInventoryLocations(store.id),
    listInventoryMovements(store.id),
    getDictionary(locale),
  ]);

  const labels = t.dashboard.inventory;
  const alerts = products.filter((product) => product.low || product.out);

  const date = (value: string) =>
    new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Africa/Abidjan",
    }).format(new Date(value));

  const stateBadge = (product: (typeof products)[number]) => {
    if (product.out) {
      return (
        <span className="rounded-full bg-red-500/12 px-2 py-0.5 text-[0.625rem] font-medium text-red-600 dark:text-red-400">
          {labels.outOfStock}
        </span>
      );
    }
    if (product.low) {
      return (
        <span className="rounded-full bg-amber-500/12 px-2 py-0.5 text-[0.625rem] font-medium text-amber-600 dark:text-amber-400">
          {labels.lowStock}
        </span>
      );
    }
    return (
      <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[0.625rem] font-medium text-emerald-600 dark:text-emerald-400">
        {labels.inStock}
      </span>
    );
  };

  const movementLabel = (delta: number) =>
    `${delta > 0 ? "+" : ""}${delta}`;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
            Catalogue
          </p>
          <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            {labels.title}
          </h1>
          <p className="mt-1 text-[0.8125rem] text-subtle">{labels.subtitle}</p>
        </div>
        <ButtonLink
          href={path(locale, "/app/inventory/export")}
          variant="outline"
          size="pill"
        >
          <Icon path={icons.download} className="h-4 w-4" strokeWidth={1.9} />
          {labels.exportCsv}
        </ButtonLink>
      </header>

      {ok === "location" ? (
        <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-3 text-[0.8125rem] text-emerald-700 dark:text-emerald-300">
          {labels.savedLocation}
        </p>
      ) : null}
      {error === "location" ? (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3.5 py-3 text-[0.8125rem] text-red-600 dark:text-red-400">
          {labels.locationError}
        </p>
      ) : null}

      {alerts.length > 0 ? (
        <section className="mt-5 flex items-start gap-3.5 rounded-3xl border border-amber-400/30 bg-amber-400/[0.07] p-5">
          <span className="mt-0.5 text-amber-600 dark:text-amber-400">
            <Icon path={icons.bell} className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="text-[0.875rem] font-medium text-fg">
              {labels.lowStockTitle}
            </h2>
            <p className="mt-1 text-[0.8125rem] text-muted">
              {alerts.length} {labels.lowStockText}
            </p>
            <p className="mt-1 text-[0.75rem] text-subtle">
              {alerts
                .slice(0, 5)
                .map((product) => product.name)
                .join(" · ")}
              {alerts.length > 5 ? "…" : ""}
            </p>
          </div>
        </section>
      ) : null}

      <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4 sm:px-6">
          <h2 className="text-[0.9375rem] font-medium text-fg">
            {labels.stockTitle}
          </h2>
          <span className="text-[0.75rem] text-subtle">
            {products.length}
          </span>
        </div>

        {products.length === 0 ? (
          <p className="px-6 py-12 text-center text-[0.875rem] text-subtle">
            {labels.noProducts}
          </p>
        ) : (
          <>
            <table className="hidden w-full sm:table">
              <thead>
                <tr className="border-b border-hairline text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
                  <th className="px-5 py-2.5 text-start font-semibold">
                    {labels.productLabel}
                  </th>
                  <th className="px-3 py-2.5 text-end font-semibold">
                    {labels.stockLabel}
                  </th>
                  <th className="px-3 py-2.5 text-end font-semibold">
                    {labels.thresholdLabel}
                  </th>
                  <th className="px-5 py-2.5 text-end font-semibold">
                    {labels.stateLabel}
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-hairline align-top last:border-0"
                  >
                    <td className="px-5 py-3">
                      <p className="text-[0.8125rem] font-medium text-fg">
                        {product.name}
                      </p>
                      {product.variants.length > 0 ? (
                        <p className="mt-0.5 text-[0.6875rem] text-subtle">
                          {product.variants
                            .map(
                              (variant) =>
                                `${variant.label} (${variant.stock})`,
                            )
                            .join(" · ")}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-end text-[0.8125rem] font-medium tabular-nums text-fg">
                      {product.stock}
                    </td>
                    <td className="px-3 py-3 text-end text-[0.8125rem] tabular-nums text-subtle">
                      {product.threshold}
                    </td>
                    <td className="px-5 py-3 text-end">{stateBadge(product)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-hairline sm:hidden">
              {products.map((product) => (
                <li key={product.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[0.8125rem] font-medium text-fg">
                        {product.name}
                      </p>
                      {product.variants.length > 0 ? (
                        <p className="mt-0.5 text-[0.6875rem] text-subtle">
                          {product.variants
                            .map(
                              (variant) =>
                                `${variant.label} (${variant.stock})`,
                            )
                            .join(" · ")}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-end">
                      <p className="text-[0.9375rem] font-semibold tabular-nums text-fg">
                        {product.stock}
                      </p>
                      <div className="mt-1">{stateBadge(product)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="mt-5">
        <InventoryAdjustForm
          products={products}
          locations={locations}
          labels={labels}
        />
      </div>

      <section className="mt-5 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">
          {labels.locationsTitle}
        </h2>
        <p className="mt-1 text-[0.8125rem] text-subtle">
          {labels.locationsHelp}
        </p>

        {locations.length === 0 ? (
          <p className="mt-3 text-[0.8125rem] text-subtle">
            {labels.noLocations}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-hairline">
            {locations.map((location) => (
              <li
                key={location.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[0.8125rem] font-medium text-fg">
                    {location.name}
                  </span>
                  <span className="rounded-full bg-hairline px-2 py-0.5 text-[0.625rem] text-subtle">
                    {labels[location.kind]}
                  </span>
                  {location.is_default ? (
                    <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[0.625rem] font-medium text-accent">
                      {labels.defaultBadge}
                    </span>
                  ) : null}
                </div>
                {!location.is_default ? (
                  <form action={setDefaultLocationAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="locationId" value={location.id} />
                    <button
                      type="submit"
                      className="text-[0.75rem] font-medium text-accent hover:text-accent-soft"
                    >
                      {labels.makeDefault}
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <form
          action={createLocationAction}
          className="mt-4 flex flex-wrap items-end gap-2"
        >
          <input type="hidden" name="locale" value={locale} />
          <label className="min-w-[12rem] flex-1">
            <span className="block text-[0.6875rem] text-subtle">
              {labels.locationName}
            </span>
            <input
              name="name"
              required
              minLength={2}
              maxLength={60}
              placeholder={labels.locationNamePlaceholder}
              className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-3 text-[0.8125rem] text-fg placeholder:text-faint focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
            />
          </label>
          <label>
            <span className="block text-[0.6875rem] text-subtle">
              {labels.locationKind}
            </span>
            <select
              name="kind"
              className="mt-1 h-9 rounded-lg border border-border bg-surface px-3 text-[0.8125rem] text-fg"
            >
              <option value="warehouse">{labels.warehouse}</option>
              <option value="shop">{labels.shop}</option>
              <option value="other">{labels.other}</option>
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-4 text-[0.75rem] font-medium text-body hover:border-border-strong"
          >
            {labels.addLocation}
          </button>
        </form>
      </section>

      <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="border-b border-hairline px-5 py-4 sm:px-6">
          <h2 className="text-[0.9375rem] font-medium text-fg">
            {labels.historyTitle}
          </h2>
        </div>

        {movements.length === 0 ? (
          <p className="px-6 py-10 text-center text-[0.8125rem] text-subtle">
            {labels.historyEmpty}
          </p>
        ) : (
          <>
            <table className="hidden w-full sm:table">
              <thead>
                <tr className="border-b border-hairline text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
                  <th className="px-5 py-2.5 text-start font-semibold">
                    {labels.columnDate}
                  </th>
                  <th className="px-3 py-2.5 text-start font-semibold">
                    {labels.columnProduct}
                  </th>
                  <th className="px-3 py-2.5 text-end font-semibold">
                    {labels.columnMovement}
                  </th>
                  <th className="px-3 py-2.5 text-start font-semibold">
                    {labels.columnReason}
                  </th>
                  <th className="px-3 py-2.5 text-start font-semibold">
                    {labels.columnLocation}
                  </th>
                  <th className="px-5 py-2.5 text-start font-semibold">
                    {labels.columnNote}
                  </th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr
                    key={movement.id}
                    className="border-b border-hairline last:border-0"
                  >
                    <td className="px-5 py-2.5 text-[0.75rem] text-subtle">
                      {date(movement.created_at)}
                    </td>
                    <td className="px-3 py-2.5 text-[0.75rem] text-body">
                      {movement.product_name}
                      {movement.variant_label
                        ? ` · ${movement.variant_label}`
                        : ""}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-end text-[0.8125rem] font-medium tabular-nums ${
                        movement.delta > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {movementLabel(movement.delta)}
                    </td>
                    <td className="px-3 py-2.5 text-[0.75rem] text-subtle">
                      {labels[REASON_KEYS[movement.reason as keyof typeof REASON_KEYS] ?? "reasonAdjustment"]}
                    </td>
                    <td className="px-3 py-2.5 text-[0.75rem] text-subtle">
                      {movement.location_name ?? "—"}
                    </td>
                    <td className="px-5 py-2.5 text-[0.75rem] text-faint">
                      {movement.note ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-hairline sm:hidden">
              {movements.map((movement) => (
                <li key={movement.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[0.8125rem] font-medium text-fg">
                        {movement.product_name}
                      </p>
                      <p className="mt-0.5 text-[0.6875rem] text-subtle">
                        {labels[REASON_KEYS[movement.reason as keyof typeof REASON_KEYS] ?? "reasonAdjustment"]}
                        {movement.location_name
                          ? ` · ${movement.location_name}`
                          : ""}
                      </p>
                      <p className="mt-0.5 text-[0.6875rem] text-faint">
                        {date(movement.created_at)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[0.9375rem] font-semibold tabular-nums ${
                        movement.delta > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {movementLabel(movement.delta)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
