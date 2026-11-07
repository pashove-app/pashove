/** Nombre de décimales ISO 4217 des devises supportées par la plateforme. */
const DECIMALS: Record<string, number> = {
  XOF: 0,
  XAF: 0,
  GNF: 0,
  UGX: 0,
  RWF: 0,
  KES: 2,
  GHS: 2,
  NGN: 2,
  TZS: 2,
  ZMW: 2,
  CDF: 2,
  SLE: 2,
  MWK: 2,
  MZN: 2,
  USD: 2,
  EUR: 2,
};

export function currencyDecimals(currency: string): number {
  return DECIMALS[currency.trim().toUpperCase()] ?? 2;
}

/** Montant mineur (centimes/unités) → montant majeur décimal. */
export function toMajor(amountMinor: number, currency: string): number {
  return amountMinor / 10 ** currencyDecimals(currency);
}

/** Montant majeur → montant mineur entier. */
export function toMinor(amountMajor: number, currency: string): number {
  return Math.round(amountMajor * 10 ** currencyDecimals(currency));
}

/** Montant mineur → chaîne décimale attendue par SasPay. */
export function formatMinor(amountMinor: number, currency: string): string {
  return toMajor(amountMinor, currency).toFixed(currencyDecimals(currency));
}
