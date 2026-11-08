"use client";

import { useActionState, useState } from "react";
import { Spinner } from "@/components/ui/primitives";
import { saveMarketsAction, type MarketsState } from "@/lib/markets/actions";
import type { PlatformMarket } from "@/lib/markets/types";

const INITIAL: MarketsState = { status: "idle" };

const CURRENCY_LABELS: Record<string, string> = {
  XOF: "Zone XOF — Afrique de l’Ouest",
  XAF: "Zone XAF — Afrique centrale",
  GHS: "Ghana",
  GNF: "Guinée",
  KES: "Kenya",
  NGN: "Nigeria",
  UGX: "Ouganda",
  CDF: "RDC (CDF)",
  USD: "Dollar",
  RWF: "Rwanda",
  SLE: "Sierra Leone",
  TZS: "Tanzanie",
  ZMW: "Zambie",
  MWK: "Malawi",
  MZN: "Mozambique",
};

export function MarketsForm({
  locale,
  markets,
  selected,
  storeCurrency,
  codEnabled,
  planCode,
  feeChargeMode,
}: {
  locale: string;
  markets: PlatformMarket[];
  selected: string[];
  storeCurrency: string;
  codEnabled: boolean;
  planCode: string;
  feeChargeMode: "client" | "merchant";
}) {
  const [state, formAction, pending] = useActionState<MarketsState, FormData>(
    saveMarketsAction,
    INITIAL,
  );

  const [checked, setChecked] = useState<Set<string>>(new Set(selected));
  const [cod, setCod] = useState(codEnabled);
  const [feeMode, setFeeMode] = useState<"client" | "merchant">(feeChargeMode);

  const enabled = markets.filter((market) => market.isEnabled);
  const groups = new Map<string, PlatformMarket[]>();
  for (const market of markets) {
    const list = groups.get(market.currency) ?? [];
    list.push(market);
    groups.set(market.currency, list);
  }
  const currencies = [...groups.keys()].sort();

  function toggle(code: string) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function selectAll() {
    setChecked(new Set(enabled.map((market) => market.code)));
  }

  function clearAll() {
    setChecked(new Set());
  }

  const foreignSelected = [...checked].some((code) => {
    const market = markets.find((entry) => entry.code === code);
    return market && market.currency !== storeCurrency;
  });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {[...checked].map((code) => (
        <input key={code} type="hidden" name="markets" value={code} />
      ))}

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[0.9375rem] font-medium text-fg">
              Pays où tu vends
            </h2>
            <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
              Seuls les pays cochés apparaîtront au checkout de ta boutique.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="rounded-full border border-border px-3 py-1.5 text-[0.6875rem] font-medium text-body hover:border-border-strong"
            >
              Tout sélectionner
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full border border-border px-3 py-1.5 text-[0.6875rem] font-medium text-subtle hover:border-border-strong"
            >
              Tout retirer
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-5">
          {currencies.map((currency) => (
            <div key={currency}>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-faint">
                {CURRENCY_LABELS[currency] ?? currency}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {groups.get(currency)!.map((market) => {
                  const disabled = !market.isEnabled;
                  const active = checked.has(market.code);

                  return (
                    <label
                      key={market.code}
                      className={`flex items-start gap-3 rounded-2xl border px-3 py-2.5 ${
                        disabled
                          ? "cursor-not-allowed border-border bg-bg opacity-50"
                          : active
                            ? "cursor-pointer border-brand-500 bg-brand-500/[0.07]"
                            : "cursor-pointer border-border bg-surface hover:border-border-strong"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        disabled={disabled}
                        onChange={() => toggle(market.code)}
                        className="mt-0.5 h-4 w-4 accent-[var(--brand-500)]"
                      />
                      <span className="min-w-0">
                        <span className="block text-[0.8125rem] font-medium text-fg">
                          {market.countryName}
                        </span>
                        <span className="block text-[0.6875rem] text-subtle">
                          {market.currency}
                          {disabled && market.note ? ` · ${market.note}` : ""}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[0.6875rem] text-faint">
          {checked.size} pays activé{checked.size > 1 ? "s" : ""}.
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">Paiement</h2>

        <label className="mt-3 flex items-start gap-3 rounded-2xl border border-border bg-bg px-3 py-3">
          <input
            type="checkbox"
            name="codEnabled"
            checked={cod}
            onChange={(event) => setCod(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--brand-500)]"
          />
          <span>
            <span className="block text-[0.8125rem] font-medium text-fg">
              Activer le paiement à la livraison
            </span>
            <span className="block text-[0.6875rem] text-subtle">
              Proposé uniquement si le panier contient au moins un produit
              physique. Jamais pour un panier 100 % numérique ou service.
            </span>
          </span>
        </label>

        {planCode === "free" ? (
          <p className="mt-3 rounded-xl border border-border bg-bg px-3 py-2.5 text-[0.6875rem] leading-relaxed text-subtle">
            Les frais SasPay sont inclus dans la commission de 10 % du plan Free.
            Ce réglage est réservé aux plans Standard et Pro.
          </p>
        ) : (
          <div className="mt-4">
            <p className="text-[0.75rem] font-medium text-fg">
              Frais SasPay
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(
                [
                  {
                    code: "client" as const,
                    title: "Le client paie les frais",
                    text: "Les frais s’ajoutent au montant débité.",
                  },
                  {
                    code: "merchant" as const,
                    title: "Je paie les frais",
                    text: "Les frais sont déduits de ton reversement.",
                  },
                ]
              ).map((entry) => {
                const active = feeMode === entry.code;
                return (
                  <button
                    key={entry.code}
                    type="button"
                    onClick={() => setFeeMode(entry.code)}
                    aria-pressed={active}
                    className={`rounded-2xl border p-3 text-start transition-colors ${
                      active
                        ? "border-brand-500 bg-brand-500/[0.07]"
                        : "border-border bg-surface hover:border-border-strong"
                    }`}
                  >
                    <span className="block text-[0.75rem] font-medium text-fg">
                      {entry.title}
                    </span>
                    <span className="mt-0.5 block text-[0.6875rem] leading-relaxed text-subtle">
                      {entry.text}
                    </span>
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="feeChargeMode" value={feeMode} />
          </div>
        )}

        <div className="mt-4 space-y-1.5 text-[0.6875rem] leading-relaxed text-subtle">
          <p>
            <span className="font-medium text-body">Mobile money</span> :
            affiché à partir de 200 (minimum SasPay).
          </p>
          <p>
            <span className="font-medium text-body">Carte bancaire</span> :
            affichée à partir de 25 000, sur tous les plans.
          </p>
        </div>

        {foreignSelected ? (
          <p className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2.5 text-[0.6875rem] leading-relaxed text-amber-700 dark:text-amber-300">
            Les pays d’une autre devise que {storeCurrency} sont enregistrés mais
            resteront indisponibles au checkout jusqu’à l’activation du moteur de
            conversion FX.
          </p>
        ) : null}
      </section>

      {state.message ? (
        <p
          role="status"
          className={`rounded-xl border px-3 py-2.5 text-[0.75rem] ${
            state.status === "saved"
              ? "border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-700 dark:text-emerald-300"
              : "border-red-500/25 bg-red-500/[0.06] text-red-600 dark:text-red-400"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-[0.875rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
      >
        {pending ? <Spinner /> : null}
        Enregistrer les pays
      </button>
    </form>
  );
}
