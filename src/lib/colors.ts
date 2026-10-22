/**
 * Couleur d'une pastille de variante.
 *
 * Le marchand saisit un nom (« Rouge », « Bleu nuit ») ou un code hexadécimal.
 * Les noms courants sont traduits ; un nom inconnu affiche une pastille neutre
 * avec son initiale, jamais une couleur inventée.
 */
const NAMED: Record<string, string> = {
  noir: "#111111",
  black: "#111111",
  blanc: "#ffffff",
  white: "#ffffff",
  rouge: "#dc2626",
  red: "#dc2626",
  bleu: "#2563eb",
  blue: "#2563eb",
  "bleu marine": "#1e3a8a",
  marine: "#1e3a8a",
  navy: "#1e3a8a",
  "bleu ciel": "#7dd3fc",
  ciel: "#7dd3fc",
  sky: "#7dd3fc",
  vert: "#16a34a",
  green: "#16a34a",
  menthe: "#a7f3d0",
  mint: "#a7f3d0",
  kaki: "#6b7a3a",
  khaki: "#6b7a3a",
  olive: "#6b7a3a",
  jaune: "#facc15",
  yellow: "#facc15",
  orange: "#f97316",
  rose: "#ec4899",
  pink: "#ec4899",
  violet: "#7c3aed",
  purple: "#7c3aed",
  mauve: "#b49ad1",
  marron: "#7c4a2d",
  brown: "#7c4a2d",
  beige: "#e8dcc8",
  gris: "#9ca3af",
  grey: "#9ca3af",
  gray: "#9ca3af",
  anthracite: "#374151",
  turquoise: "#14b8a6",
  bordeaux: "#7f1d1d",
  dore: "#d4af37",
  doree: "#d4af37",
  gold: "#d4af37",
  argente: "#c0c0c4",
  silver: "#c0c0c4",
  creme: "#f5f0e1",
  cream: "#f5f0e1",
  taupe: "#8b7d6b",
};

export function swatchColor(value: string): string | null {
  const raw = value.trim();

  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return raw;

  const key = raw
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  return NAMED[key] ?? null;
}
