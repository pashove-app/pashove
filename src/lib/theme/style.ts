import type { CSSProperties } from "react";
import { isLight, mix, normalizeHex, withAlpha } from "@/lib/theme/color";
import type { StoreTheme } from "@/lib/theme/types";

type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

/**
 * Traduit un thème de boutique en jetons CSS hérités.
 *
 * Les composants de la vitrine utilisent déjà exclusivement les jetons
 * sémantiques ; on peut donc changer toute la palette sans toucher au JSX.
 */
export function themeStyle(theme: StoreTheme): ThemeStyle {
  const bg = normalizeHex(theme.backgroundColor, "#04060D");
  const surface = normalizeHex(theme.surfaceColor, "#0B101B");
  const fg = normalizeHex(theme.foregroundColor, "#FFFFFF");
  const accent = normalizeHex(theme.accentColor, "#2F5CFF");
  const light = isLight(bg);
  const accentText = light ? accent : mix(accent, "#FFFFFF", 0.28);

  return {
    "--color-bg": bg,
    "--color-bg-soft": mix(bg, fg, 0.03),
    "--color-surface": surface,
    "--color-surface-2": mix(surface, fg, 0.06),
    "--color-surface-3": mix(surface, fg, 0.11),
    "--color-fg": fg,
    "--color-body": withAlpha(fg, 0.82),
    "--color-muted": withAlpha(fg, 0.58),
    "--color-subtle": withAlpha(fg, 0.44),
    "--color-faint": withAlpha(fg, 0.28),
    "--color-border": mix(bg, fg, 0.12),
    "--color-border-soft": withAlpha(fg, 0.1),
    "--color-border-strong": withAlpha(fg, 0.2),
    "--color-hairline": withAlpha(fg, 0.05),
    "--color-hairline-strong": withAlpha(fg, 0.09),
    "--color-fill": withAlpha(fg, 0.12),
    "--color-fill-strong": withAlpha(fg, 0.24),
    "--color-accent": accentText,
    "--color-accent-soft": mix(accent, fg, 0.22),
    "--color-accent-strong": mix(accent, fg, 0.36),
    "--color-brand-400": mix(accent, "#FFFFFF", 0.16),
    "--color-brand-500": accent,
    "--color-brand-600": mix(accent, "#000000", 0.16),
    "--color-on-accent": isLight(accent) ? "#05070F" : "#FFFFFF",
    "--color-grad-1": mix(accent, "#FFFFFF", 0.28),
    "--color-grad-2": accent,
    "--color-grad-3": mix(accent, "#000000", 0.22),
    "--color-panel-from": mix(bg, accent, 0.14),
    "--color-panel-mid": mix(bg, accent, 0.06),
    "--color-panel-to": bg,
    "--color-scrim": withAlpha(bg, light ? 0.7 : 0.62),
    "--color-scrim-strong": withAlpha(bg, 0.88),
    backgroundColor: bg,
    color: fg,
    colorScheme: light ? "light" : "dark",
    fontFamily:
      theme.font === "serif"
        ? 'Georgia, "Times New Roman", serif'
        : theme.font === "mono"
          ? 'ui-monospace, "SF Mono", monospace'
          : undefined,
  };
}
