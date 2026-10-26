"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { applyThemePresetAction } from "@/lib/theme/actions";
import { THEME_PRESETS } from "@/lib/theme/presets";
import type { StoreTheme, ThemePresetId } from "@/lib/theme/types";

type Labels = Dictionary["dashboard"]["theme"];

function presetLabel(id: ThemePresetId, labels: Labels): string {
  if (id === "pashove") return labels.presetPashove;
  if (id === "ivoire") return labels.presetIvoire;
  if (id === "foret") return labels.presetForet;
  return labels.presetMinuit;
}

export function PresetPicker({
  storeId,
  slug,
  locale,
  activePreset,
  labels,
}: {
  storeId: string;
  slug: string;
  locale: Locale;
  activePreset: StoreTheme["preset"];
  labels: Labels;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<ThemePresetId | null>(null);
  const [active, setActive] = useState(activePreset);
  const [error, setError] = useState(false);

  async function apply(id: ThemePresetId) {
    if (pending) return;
    setPending(id);
    setError(false);

    const result = await applyThemePresetAction(storeId, id);
    setPending(null);

    if (!result.ok) {
      setError(true);
      return;
    }

    setActive(id);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            {labels.title}
          </h1>
          <p className="mt-1 text-[0.875rem] text-subtle">{labels.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={path(locale, `/store/${slug}`)}
            target="_blank"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-[0.8125rem] font-medium text-body transition-colors hover:border-border-strong hover:text-fg"
          >
            <Icon path={icons.store} className="h-4 w-4" strokeWidth={1.8} />
            {labels.preview}
          </Link>
          <Link
            href={path(locale, "/app/online-store/editor")}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-500 px-5 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-600"
          >
            <Icon path={icons.settings} className="h-4 w-4" strokeWidth={1.8} />
            {labels.customize}
          </Link>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-400/25 bg-red-400/[0.07] px-3 py-2 text-[0.75rem] font-medium text-red-600 dark:text-red-400"
        >
          {labels.saveError}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {THEME_PRESETS.map((preset) => {
          const isActive = active === preset.id;
          const isPending = pending === preset.id;

          return (
            <article
              key={preset.id}
              className={cn(
                "overflow-hidden rounded-3xl border bg-surface transition-colors",
                isActive ? "border-brand-500" : "border-border",
              )}
            >
              <div
                className="relative h-32 p-4"
                style={{ backgroundColor: preset.backgroundColor }}
              >
                <div
                  className="h-full rounded-2xl border p-3"
                  style={{
                    backgroundColor: preset.surfaceColor,
                    borderColor: preset.foregroundColor + "22",
                    color: preset.foregroundColor,
                    fontFamily:
                      preset.font === "serif"
                        ? 'Georgia, "Times New Roman", serif'
                        : undefined,
                  }}
                >
                  <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.16em] opacity-60">
                    {labels.preview}
                  </p>
                  <p className="mt-1 text-[1rem] font-medium">{preset.name}</p>
                  <span
                    className="mt-2 inline-flex rounded-full px-2.5 py-1 text-[0.5625rem] font-semibold text-white"
                    style={{ backgroundColor: preset.accentColor }}
                  >
                    {labels.apply}
                  </span>
                </div>
                {isActive ? (
                  <span className="absolute end-3 top-3 rounded-full bg-brand-500 px-2 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-wide text-white">
                    {labels.active}
                  </span>
                ) : null}
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[0.9375rem] font-medium text-fg">
                      {presetLabel(preset.id, labels)}
                    </h2>
                    <p className="mt-0.5 text-[0.75rem] leading-relaxed text-subtle">
                      {preset.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void apply(preset.id)}
                    disabled={Boolean(pending) || isActive}
                    className={cn(
                      "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[0.75rem] font-medium transition-colors",
                      isActive
                        ? "bg-hairline text-subtle"
                        : "bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60",
                    )}
                  >
                    {isPending ? <Spinner /> : null}
                    {isActive
                      ? labels.active
                      : isPending
                        ? labels.applying
                        : labels.apply}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-5 text-[0.75rem] text-subtle">
        {labels.heroHint}
      </p>
    </div>
  );
}
