/** Petits utilitaires de couleur, sans dépendance. */

export function normalizeHex(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
    ? value.toUpperCase()
    : fallback;
}

function rgb(hex: string): [number, number, number] {
  const value = normalizeHex(hex, "#000000").slice(1);
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function hex(value: number): string {
  return Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, "0");
}

export function withAlpha(color: string, alpha: number): string {
  const [red, green, blue] = rgb(color);
  return `rgb(${red} ${green} ${blue} / ${Math.min(1, Math.max(0, alpha))})`;
}

/** Mélange `ratio` de `b` dans `a` (0 = a, 1 = b). */
export function mix(a: string, b: string, ratio: number): string {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  const t = Math.min(1, Math.max(0, ratio));

  return `#${hex(ar + (br - ar) * t)}${hex(ag + (bg - ag) * t)}${hex(
    ab + (bb - ab) * t,
  )}`.toUpperCase();
}

export function isLight(color: string): boolean {
  const [red, green, blue] = rgb(color);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.55;
}
