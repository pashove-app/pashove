import type { Metadata } from "next";
import { Icon, icons } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";
import {
  deleteDeliveryZoneAction,
  saveDeliveryZoneAction,
} from "@/lib/delivery/pricing-actions";
import { adminDeliveryZones } from "@/lib/delivery/pricing-queries";
import { getPlatformMarkets } from "@/lib/markets/queries";

export const metadata: Metadata = {
  title: "Pashove · Tarifs livraison",
  robots: { index: false, follow: false },
};

export default async function DeliveryPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const [zones, markets] = await Promise.all([
    adminDeliveryZones(),
    getPlatformMarkets(),
  ]);

  const enabled = markets.filter((market) => market.isEnabled);
  const groups = new Map<string, typeof zones>();
  for (const zone of zones) {
    const key = `${zone.countryCode}-${zone.currency}`;
    const list = groups.get(key) ?? [];
    list.push(zone);
    groups.set(key, list);
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        Tarifs de livraison
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">
        Grille Pashove Delivery, par pays et par zone. Le marchand active le
        service ; il ne fixe pas les prix.
      </p>

      {ok ? (
        <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-3 text-[0.8125rem] text-emerald-700 dark:text-emerald-300">
          Grille enregistrée.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3.5 py-3 text-[0.8125rem] text-red-600 dark:text-red-400">
          Enregistrement impossible. Vérifie le pays, le nom et le montant.
        </p>
      ) : null}

      <section className="mt-6 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">
          Ajouter une zone
        </h2>
        <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
          Exemple : Mali, « Bamako » à 1 000 FCFA, puis « Autres villes » à
          2 500 FCFA. Une seule zone par défaut par pays.
        </p>

        <form action={saveDeliveryZoneAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-[0.75rem] font-medium text-body">
            Pays et devise
            <select
              name="market"
              required
              className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg"
            >
              {enabled.map((market) => (
                <option key={market.code} value={`${market.countryCode}-${market.currency}`}>
                  {market.countryName} ({market.currency})
                </option>
              ))}
            </select>
          </label>
          <label className="text-[0.75rem] font-medium text-body">
            Nom de la zone
            <input
              name="name"
              required
              maxLength={80}
              placeholder="Bamako, Autres villes…"
              className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg"
            />
          </label>
          <label className="text-[0.75rem] font-medium text-body">
            Tarif
            <input
              name="fee"
              type="number"
              min={0}
              step={1}
              required
              placeholder="1000"
              className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg"
            />
          </label>
          <label className="flex items-center gap-2 self-end text-[0.75rem] text-body">
            <input type="checkbox" name="isDefault" className="h-4 w-4 accent-[var(--brand-500)]" />
            Zone par défaut
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-500 px-5 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-600"
            >
              <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
              Ajouter la zone
            </button>
          </div>
        </form>
      </section>

      <div className="mt-6 space-y-5">
        {[...groups.entries()].map(([key, list]) => {
          const [country, currency] = key.split("-");
          return (
            <section key={key}>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-faint">
                {country} · {currency}
              </p>
              <ul className="mt-2 space-y-2">
                {list.map((zone) => (
                  <li
                    key={zone.id}
                    className="rounded-2xl border border-border bg-surface p-4"
                  >
                    <form
                      action={saveDeliveryZoneAction}
                      className="flex flex-wrap items-end gap-3"
                    >
                      <input type="hidden" name="id" value={zone.id} />
                      <input type="hidden" name="country" value={zone.countryCode} />
                      <input type="hidden" name="currency" value={zone.currency} />
                      <label className="min-w-[10rem] flex-1 text-[0.6875rem] text-subtle">
                        Nom
                        <input
                          name="name"
                          defaultValue={zone.name}
                          required
                          maxLength={80}
                          className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-3 text-[0.8125rem] text-fg"
                        />
                      </label>
                      <label className="w-32 text-[0.6875rem] text-subtle">
                        Tarif
                        <input
                          name="fee"
                          type="number"
                          min={0}
                          defaultValue={zone.feeAmount}
                          required
                          className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-3 text-[0.8125rem] text-fg"
                        />
                      </label>
                      <label className="flex items-center gap-1.5 pb-2 text-[0.75rem] text-body">
                        <input
                          type="checkbox"
                          name="isDefault"
                          defaultChecked={zone.isDefault}
                          className="h-4 w-4 accent-[var(--brand-500)]"
                        />
                        Défaut
                      </label>
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center rounded-full border border-border px-3 text-[0.75rem] font-medium text-body hover:border-border-strong"
                      >
                        Enregistrer
                      </button>
                      <span className="text-[0.75rem] text-subtle">
                        {formatMoney(zone.feeAmount, zone.currency, "fr-FR")}
                      </span>
                    </form>
                    <form action={deleteDeliveryZoneAction} className="mt-2">
                      <input type="hidden" name="id" value={zone.id} />
                      <button
                        type="submit"
                        className="text-[0.6875rem] font-medium text-red-600 hover:underline dark:text-red-400"
                      >
                        Supprimer cette zone
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {zones.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border bg-surface px-5 py-8 text-center text-[0.875rem] text-subtle">
          Aucune zone définie. Ajoute la première grille ci-dessus.
        </p>
      ) : null}
    </div>
  );
}
