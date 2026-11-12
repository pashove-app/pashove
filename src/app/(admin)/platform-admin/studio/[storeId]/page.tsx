import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon, icons } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";
import { creditStudioAction } from "@/lib/studio/admin-actions";
import {
  adminStudioPricing,
  getStudioMerchantDetail,
} from "@/lib/studio/admin-queries";
import type {
  StudioGenerationStatus,
  StudioTopup,
} from "@/lib/studio/types";

export const metadata: Metadata = {
  title: "Pashove · Studio marchand",
  robots: { index: false, follow: false },
};

const TOPUP_PROVIDERS: Record<StudioTopup["provider"], string> = {
  saspay: "SasPay",
  manual: "Geste commercial",
  welcome: "Bienvenue",
};

const TOPUP_STATUS: Record<StudioTopup["status"], string> = {
  pending: "Préparée",
  initiated: "Initiée",
  paid: "Payée",
  failed: "Échouée",
};

const GENERATION_STATUS: Record<StudioGenerationStatus, string> = {
  pending: "En attente",
  processing: "En cours",
  completed: "Terminée",
  failed: "Échouée",
};

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

function excerpt(value: string | null, max = 120): string | null {
  if (!value) return null;
  const clean = value.trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

export default async function AdminStudioMerchantPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { storeId } = await params;
  const { ok, error } = await searchParams;

  const [detail, pricing] = await Promise.all([
    getStudioMerchantDetail(storeId),
    adminStudioPricing(),
  ]);

  if (!detail) notFound();

  const money = (amount: number) => formatMoney(amount, "XOF", "fr-FR");
  const labels = new Map(
    pricing.map((price) => [price.actionType, price.label]),
  );

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link
        href="/platform-admin/studio"
        className="inline-flex items-center gap-1.5 text-[0.75rem] text-subtle transition-colors hover:text-fg"
      >
        <Icon path={icons.arrowRight} className="h-3.5 w-3.5 rotate-180" strokeWidth={2} />
        Retour au Studio
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
            Studio marchand
          </p>
          <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            {detail.store.name}
          </h1>
          <p className="mt-1 text-[0.8125rem] text-subtle">
            {detail.store.slug} · {detail.store.country} ·{" "}
            {detail.store.currency} ·{" "}
            {STORE_STATUS[detail.store.status] ?? detail.store.status}
          </p>
        </div>
        <Link
          href={`/fr/store/${detail.store.slug}`}
          target="_blank"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-[0.75rem] font-medium text-subtle hover:border-border-strong hover:text-fg"
        >
          Voir la boutique
          <Icon path={icons.arrowUpRight} className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </header>

      {ok ? (
        <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-3 text-[0.8125rem] text-emerald-700 dark:text-emerald-300">
          Enregistré.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3.5 py-3 text-[0.8125rem] text-red-600 dark:text-red-400">
          Opération impossible. Vérifie le montant et réessaie.
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Solde actuel" value={money(detail.balance.balanceFcfa)} />
        <Stat label="Total rechargé" value={money(detail.balance.totalRecharged)} />
        <Stat label="Total dépensé" value={money(detail.balance.totalSpent)} />
      </div>

      <section className="mt-6 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">
          Créditer manuellement
        </h2>
        <p className="mt-1 text-[0.75rem] text-subtle">
          Geste commercial immédiat. Il n’est pas compté dans le CA des
          recharges.
        </p>

        <form
          action={creditStudioAction}
          className="mt-4 grid gap-3 sm:grid-cols-[12rem_1fr_auto] sm:items-end"
        >
          <input type="hidden" name="storeId" value={detail.store.id} />
          <label>
            <span className="block text-[0.6875rem] text-subtle">Montant</span>
            <div className="relative mt-1">
              <input
                name="amount"
                type="number"
                min={1}
                max={1000000}
                step={1}
                required
                placeholder="1000"
                className="h-10 w-full rounded-xl border border-border bg-bg px-3 pe-14 text-[0.875rem] text-fg"
              />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[0.625rem] text-faint">
                FCFA
              </span>
            </div>
          </label>
          <label>
            <span className="block text-[0.6875rem] text-subtle">
              Motif (facultatif)
            </span>
            <input
              name="reason"
              maxLength={200}
              placeholder="Geste commercial, remboursement…"
              className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand-500 px-5 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-600"
          >
            <Icon path={icons.plus} className="h-3.5 w-3.5" strokeWidth={2.4} />
            Créditer
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">
          Recharges et crédits
        </h2>

        {detail.topups.length === 0 ? (
          <p className="mt-4 text-[0.8125rem] text-subtle">
            Aucune recharge pour l’instant.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-hairline">
            {detail.topups.map((topup) => (
              <div
                key={topup.id}
                className="flex flex-wrap items-start justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-[0.8125rem] font-medium text-fg">
                    {TOPUP_PROVIDERS[topup.provider]} ·{" "}
                    {TOPUP_STATUS[topup.status]}
                  </p>
                  <p className="mt-0.5 text-[0.6875rem] text-faint">
                    {formatDate(topup.paidAt ?? topup.createdAt)}
                    {topup.note ? ` · ${topup.note}` : ""}
                  </p>
                </div>
                <p className="text-[0.8125rem] font-medium text-fg">
                  + {money(topup.amountFcfa)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">
          Générations
        </h2>

        {detail.generations.length === 0 ? (
          <p className="mt-4 text-[0.8125rem] text-subtle">
            Aucune génération pour l’instant.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-hairline">
            {detail.generations.map((generation) => (
              <div key={generation.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[0.8125rem] font-medium text-fg">
                        {labels.get(generation.actionType) ??
                          generation.actionType}
                      </p>
                      <span className="rounded-full bg-hairline px-2 py-0.5 text-[0.625rem] text-subtle">
                        {GENERATION_STATUS[generation.status]}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[0.6875rem] text-faint">
                      {excerpt(generation.prompt) ?? "Sans consigne"}
                    </p>
                    <p className="mt-1 text-[0.6875rem] text-subtle">
                      prix {money(generation.pricePaidFcfa)} · coût{" "}
                      {money(generation.costRealFcfa)} · marge{" "}
                      {money(generation.marginFcfa)}
                    </p>
                  </div>
                  <p className="text-[0.6875rem] text-faint">
                    {formatDate(generation.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
        {label}
      </p>
      <p className="mt-1.5 text-[1.25rem] font-medium tracking-[-0.02em] text-fg">
        {value}
      </p>
    </div>
  );
}
