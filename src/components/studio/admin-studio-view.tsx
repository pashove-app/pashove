import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";
import { updateStudioPricingAction } from "@/lib/studio/admin-actions";
import type {
  AdminStudioMerchant,
  StudioOverview,
} from "@/lib/studio/admin-queries";
import type { StudioPrice } from "@/lib/studio/types";

const STORE_STATUS: Record<string, string> = {
  active: "active",
  suspended: "suspendue",
  draft: "brouillon",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Abidjan",
  }).format(new Date(value));
}

export function AdminStudioView({
  overview,
  pricing,
  merchants,
  ok,
  error,
}: {
  overview: StudioOverview;
  pricing: StudioPrice[];
  merchants: AdminStudioMerchant[];
  ok?: string;
  error?: string;
}) {
  const money = (amount: number) => formatMoney(amount, "XOF", "fr-FR");

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
          Plateforme
        </p>
        <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          Pashove Studio
        </h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
          Tarifs de l’IA, recharges des marchands et marge réelle. Le CA
          correspond aux recharges SasPay payées ; les crédits offerts et les
          gestes commerciaux n’y sont pas comptés.
        </p>
      </header>

      {ok ? (
        <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-3 text-[0.8125rem] text-emerald-700 dark:text-emerald-300">
          Enregistré.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3.5 py-3 text-[0.8125rem] text-red-600 dark:text-red-400">
          Enregistrement impossible. Vérifie le montant et réessaie.
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="Recharges encaissées"
          value={money(overview.recharged)}
          hint="SasPay payées"
        />
        <Stat
          label="Dépensé par les marchands"
          value={money(overview.spent)}
          hint="Générations facturées"
        />
        <Stat
          label="Coût API réel"
          value={money(overview.cost)}
          hint="DeepSeek, TTS, Remotion"
        />
        <Stat
          label="Marge"
          value={money(overview.margin)}
          hint="Prix payé − coût réel"
        />
        <Stat
          label="Soldes en circulation"
          value={money(overview.balances)}
          hint="Crédits non consommés"
        />
        <Stat
          label="Marchands Studio"
          value={String(overview.merchants)}
          hint="Portefeuilles ouverts"
        />
      </div>

      <section className="mt-6 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[0.9375rem] font-medium text-fg">Tarifs</h2>
            <p className="mt-1 text-[0.75rem] text-subtle">
              Le prix est débité du solde au moment de la génération.
            </p>
          </div>
          <span className="text-[0.6875rem] text-faint">
            {pricing.length} actions
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {pricing.map((price) => (
            <form
              key={price.actionType}
              action={updateStudioPricingAction}
              className="rounded-2xl border border-border bg-bg-soft p-4"
            >
              <input type="hidden" name="actionType" value={price.actionType} />
              <p className="text-[0.8125rem] font-medium text-fg">
                {price.label}
              </p>
              {price.description ? (
                <p className="mt-1 text-[0.6875rem] text-subtle">
                  {price.description}
                </p>
              ) : null}
              <div className="mt-3 flex items-end gap-2">
                <label className="flex-1">
                  <span className="block text-[0.625rem] uppercase tracking-[0.1em] text-faint">
                    Prix
                  </span>
                  <div className="relative mt-1">
                    <input
                      name="price"
                      type="number"
                      min={0}
                      max={1000000}
                      step={1}
                      defaultValue={price.priceFcfa}
                      className="h-10 w-full rounded-xl border border-border bg-surface px-3 pe-14 text-[0.875rem] text-fg"
                    />
                    <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[0.625rem] text-faint">
                      FCFA
                    </span>
                  </div>
                </label>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-500 px-4 text-[0.75rem] font-medium text-white transition-colors hover:bg-brand-600"
                >
                  <Icon
                    path={icons.check}
                    className="h-3.5 w-3.5"
                    strokeWidth={2.4}
                  />
                  Enregistrer
                </button>
              </div>
            </form>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[0.9375rem] font-medium text-fg">Marchands</h2>
          <span className="text-[0.6875rem] text-faint">
            {merchants.length}
          </span>
        </div>

        {merchants.length === 0 ? (
          <p className="mt-4 text-[0.8125rem] text-subtle">
            Aucune boutique pour l’instant.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-hairline">
            {merchants.map((merchant) => (
              <Link
                key={merchant.id}
                href={`/platform-admin/studio/${merchant.id}`}
                className="flex flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:text-brand-600"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8125rem] font-medium text-fg">
                    {merchant.name}
                  </p>
                  <p className="truncate text-[0.6875rem] text-faint">
                    {merchant.slug}
                    {merchant.status !== "active"
                      ? ` · ${STORE_STATUS[merchant.status] ?? merchant.status}`
                      : ""}
                    {merchant.lastGenerationAt
                      ? ` · dernière génération ${formatDate(merchant.lastGenerationAt)}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-5 text-right">
                  <div>
                    <p className="text-[0.625rem] uppercase tracking-[0.1em] text-faint">
                      Solde
                    </p>
                    <p className="text-[0.8125rem] font-medium text-fg">
                      {money(merchant.balanceFcfa)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.625rem] uppercase tracking-[0.1em] text-faint">
                      Dépensé
                    </p>
                    <p className="text-[0.8125rem] text-subtle">
                      {money(merchant.totalSpent)}
                    </p>
                  </div>
                  <Icon
                    path={icons.arrowRight}
                    className="h-4 w-4 text-faint"
                    strokeWidth={2}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
        {label}
      </p>
      <p className="mt-1.5 text-[1.35rem] font-medium tracking-[-0.02em] text-fg">
        {value}
      </p>
      <p className="mt-0.5 text-[0.6875rem] text-subtle">{hint}</p>
    </div>
  );
}
