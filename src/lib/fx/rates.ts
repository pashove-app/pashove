import { createPublicClient } from "@/lib/supabase/public";
import {
  listExchangeRates,
  type SasPayExchangeRate,
} from "@/lib/payments/saspay/client";
import { currencyDecimals } from "@/lib/fx/currency";

export type FxQuote = {
  from: string;
  to: string;
  /** Unités de `to` pour 1 unité de `from`. */
  rate: number;
  source: "saspay" | "manual" | "identity";
};

let sasPayCache: { at: number; value: SasPayExchangeRate[] } | null = null;
const TTL_MS = 10 * 60 * 1000;

async function sasPayRates(): Promise<SasPayExchangeRate[]> {
  const now = Date.now();
  if (sasPayCache && now - sasPayCache.at < TTL_MS) return sasPayCache.value;
  const value = await listExchangeRates();
  sasPayCache = { at: now, value };
  return value;
}

function findPair(
  rates: SasPayExchangeRate[],
  from: string,
  to: string,
): number | null {
  const direct = rates.find(
    (entry) =>
      entry.from_currency?.toUpperCase() === from &&
      entry.to_currency?.toUpperCase() === to,
  );
  if (direct) {
    const value = Number(direct.rate);
    if (Number.isFinite(value) && value > 0) return value;
  }

  const inverse = rates.find(
    (entry) =>
      entry.from_currency?.toUpperCase() === to &&
      entry.to_currency?.toUpperCase() === from,
  );
  if (inverse) {
    const value = Number(inverse.rate);
    if (Number.isFinite(value) && value > 0) return 1 / value;
  }

  return null;
}

async function manualRate(from: string, to: string): Promise<number | null> {
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("public_fx_rate", {
    p_from: from,
    p_to: to,
  });
  const value = Number(data);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Taux retenu pour une paire. Ordre : SasPay, puis taux manuel de la
 * plateforme. Aucun taux inventé : sans source, la paire est indisponible.
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
): Promise<FxQuote | null> {
  const from = fromCurrency.trim().toUpperCase();
  const to = toCurrency.trim().toUpperCase();

  if (!from || !to) return null;
  if (from === to) return { from, to, rate: 1, source: "identity" };

  try {
    const rate = findPair(await sasPayRates(), from, to);
    if (rate !== null) return { from, to, rate, source: "saspay" };
  } catch (error) {
    console.error("[fx] SasPay rates unavailable", error);
  }

  try {
    const rate = await manualRate(from, to);
    if (rate !== null) return { from, to, rate, source: "manual" };
  } catch (error) {
    console.error("[fx] manual rate unavailable", error);
  }

  return null;
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
  const toMinor = Math.round(fromMajor * quote.rate * 10 ** currencyDecimals(quote.to));

  return {
    ...quote,
    amountMinor: toMinor,
    amountDecimal: (
      toMinor / 10 ** currencyDecimals(quote.to)
    ).toFixed(currencyDecimals(quote.to)),
  };
}
