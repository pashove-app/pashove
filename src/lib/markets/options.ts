import type { PlatformMarket } from "@/lib/markets/types";

export type CountryOption = { code: string; name: string };

/**
 * Une entrée par pays, pas par devise : la République démocratique du Congo
 * apparaît deux fois dans les marchés (CDF et USD) mais reste un seul pays.
 */
export function countryOptions(markets: PlatformMarket[]): CountryOption[] {
  return [
    ...new Map(
      markets
        .filter((market) => market.isEnabled)
        .map((market) => [
          market.countryCode,
          { code: market.countryCode, name: market.countryName },
        ]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));
}
