import { createPublicClient } from "@/lib/supabase/public";
import { currencyDecimals } from "@/lib/fx/currency";

export type FxQuote = {
  from: string;
  to: string;
  /** Unités de `to` pour 1 unité de `from`. */
  rate: number;
  source: "saspay" | "manual" | "identity";
};

/**
 * Taux retenu pour une paire.
 *
 * Lecture unique dans `fx_rates`, alimentée par :
 * - le cron `fx-rates` (source `saspay`, toutes les 6 h) ;
 * - un taux manuel posé par un admin (source `manual`).
 *
 * Aucun appel à l'API SasPay au checkout : les 9 000 paires ne sont jamais
 * parcourues pendant une commande.
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
): Promise<FxQuote | null> {
  const from = fromCurrency.trim().toUpperCase();
  const to = toCurrency.trim().toUpperCase();

  if (!from || !to) return null;
  if (from === to) return { from, to, rate: 1, source: "identity" };

  const supabase = createPublicClient();
  const { data } = await supabase.rpc("public_fx_quote", {
    p_from: from,
    p_to: to,
  });

  const row = (data ?? null) as { rate?: unknown; source?: unknown } | null;
  const rate = Number(row?.rate);

  if (!Number.isFinite(rate) || rate <= 0) return null;

  return {
    from,
    to,
    rate,
    source: row?.source === "saspay" ? "saspay" : "manual",
  };
}

export type FxConversion = FxQuote & {
  amountMinor: number;
  amountDecimal: string;
};

/**
 * Convertit un montant mineur de la devise source vers la devise cible.
 * Arrondi au plus proche : Pashove absorbe l'écart, le client paie le
 * montant exact affiché.
 */
export async function convertMinor(
  amountMinor: number,
  fromCurrency: string,
  toCurrency: string,
): Promise<FxConversion | null> {
  const quote = await getExchangeRate(fromCurrency, toCurrency);
  if (!quote) return null;

  const fromMajor = amountMinor / 10 ** currencyDecimals(quote.from);
  const toMinor = Math.round(
    fromMajor * quote.rate * 10 ** currencyDecimals(quote.to),
  );

  return {
    ...quote,
    amountMinor: toMinor,
    amountDecimal: (
      toMinor / 10 ** currencyDecimals(quote.to)
    ).toFixed(currencyDecimals(quote.to)),
  };
}
