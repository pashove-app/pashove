export type PayoutCountry = "SN" | "CI" | "ML" | "BF" | "BJ" | "TG";

export type PayoutProvider =
  | "orange"
  | "wave"
  | "mtn"
  | "moov"
  | "free"
  | "togo";

export const PAYOUT_COUNTRIES: PayoutCountry[] = [
  "SN",
  "CI",
  "ML",
  "BF",
  "BJ",
  "TG",
];

/** Noms de marque : ils ne se traduisent pas. */
export const PROVIDER_LABELS: Record<PayoutProvider, string> = {
  orange: "Orange Money",
  wave: "Wave",
  mtn: "MTN MoMo",
  moov: "Moov Money",
  free: "Free Money",
  togo: "T-Money",
};

export const PROVIDERS_BY_COUNTRY: Record<PayoutCountry, PayoutProvider[]> = {
  SN: ["orange", "wave", "free"],
  CI: ["orange", "wave", "mtn", "moov"],
  ML: ["orange", "moov"],
  BF: ["orange", "moov"],
  BJ: ["mtn", "moov"],
  TG: ["togo", "moov"],
};

export function providersForCountry(country: PayoutCountry): PayoutProvider[] {
  return PROVIDERS_BY_COUNTRY[country] ?? [];
}

export function isProviderAllowed(
  country: string,
  provider: string,
): boolean {
  if (!PAYOUT_COUNTRIES.includes(country as PayoutCountry)) return false;
  return providersForCountry(country as PayoutCountry).includes(
    provider as PayoutProvider,
  );
}
