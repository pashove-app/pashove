/**
 * Marchés d'aperçu de l'éditeur.
 *
 * Les taux sont **uniquement** destinés à la prévisualisation : aucun calcul
 * financier réel ne les utilise. Les vrais montants restent calculés en base.
 */
export type PreviewMarket = "all" | "ML" | "SN" | "CI" | "GH" | "FR" | "INT";

export const PREVIEW_MARKETS: { id: PreviewMarket; label: string }[] = [
  { id: "all", label: "Tous les marchés" },
  { id: "ML", label: "Mali · XOF" },
  { id: "SN", label: "Sénégal · XOF" },
  { id: "CI", label: "Côte d’Ivoire · XOF" },
  { id: "GH", label: "Ghana · GHS" },
  { id: "FR", label: "France · EUR" },
  { id: "INT", label: "International · USD" },
];

export type PreviewMarketConfig = {
  country: string;
  currency: string;
  /** Multiplicateur depuis la devise de la boutique (XOF). */
  rate: number;
  label: string;
};

const CONFIG: Record<Exclude<PreviewMarket, "all">, PreviewMarketConfig> = {
  ML: { country: "ML", currency: "XOF", rate: 1, label: "Mali" },
  SN: { country: "SN", currency: "XOF", rate: 1, label: "Sénégal" },
  CI: { country: "CI", currency: "XOF", rate: 1, label: "Côte d’Ivoire" },
  GH: { country: "GH", currency: "GHS", rate: 0.025, label: "Ghana" },
  FR: { country: "FR", currency: "EUR", rate: 0.001524, label: "France" },
  INT: { country: "INT", currency: "USD", rate: 0.001667, label: "International" },
};

export function previewMarketConfig(market: string): PreviewMarketConfig | null {
  if (market === "all") return null;
  return CONFIG[market as Exclude<PreviewMarket, "all">] ?? null;
}
