"use client";

import Link from "next/link";
import { useState } from "react";
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
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
            Boutique en ligne
          </p>
          <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.035em] text-fg sm:text-[2.125rem]">
            {labels.title}
          </h1>
          <p className="mt-1.5 max-w-xl text-[0.875rem] leading-relaxed text-subtle">
            {labels.subtitle}
          </p>
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
            <Icon path={icons.palette} className="h-4 w-4" strokeWidth={1.8} />
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

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[1.125rem] font-medium tracking-[-0.02em] text-fg">
            Découvrir des thèmes
          </h2>
          <p className="mt-1 text-[0.8125rem] text-subtle">
            Tous les thèmes officiels sont gratuits et personnalisables.
          </p>
        </div>
        <span className="hidden rounded-full border border-border px-3 py-1 text-[0.6875rem] font-medium text-subtle sm:inline-flex">
          {THEME_PRESETS.length} modèles
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {THEME_PRESETS.map((preset) => {
          const isActive = active === preset.id;
          const isPending = pending === preset.id;

          return (
            <article
              key={preset.id}
              className={cn(
                "group overflow-hidden rounded-2xl border bg-surface transition-colors",
                isActive
                  ? "border-brand-500/60 ring-1 ring-brand-500/25"
                  : "border-border hover:border-border-strong",
              )}
            >
              <div className="relative">
                <MiniPreview preset={preset} />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                  <Link
                    href={path(locale, "/app/online-store/editor")}
                    className="pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[0.75rem] font-semibold text-[#1d1d1f] shadow-lg"
                  >
                    {labels.customize}
                  </Link>
                </div>
                {isActive ? (
                  <span className="absolute start-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[0.5625rem] font-semibold uppercase tracking-wide text-white">
                    {labels.active}
                  </span>
                ) : null}
              </div>

              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <h3 className="text-[0.9375rem] font-medium text-fg">
                    {presetLabel(preset.id, labels)}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[0.75rem] leading-relaxed text-subtle">
                    {preset.description}
                  </p>
                  <p className="mt-2 text-[0.6875rem] font-medium text-faint">
                    Gratuit
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void apply(preset.id)}
                  disabled={Boolean(pending) || isActive}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[0.75rem] font-medium transition-colors",
                    isActive
                      ? "border border-border text-subtle"
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
            </article>
          );
        })}
      </div>

      <p className="mt-6 text-[0.75rem] leading-relaxed text-subtle">
        {labels.heroHint}
      </p>
    </div>
  );
}

function MiniPreview({
  preset,
}: {
  preset: (typeof THEME_PRESETS)[number];
}) {
  const serif = preset.font === "serif";

  return (
    <div
      className="aspect-[16/10] overflow-hidden p-4"
      style={{ backgroundColor: preset.backgroundColor }}
    >
      <div
        className="flex h-full flex-col overflow-hidden rounded-lg border"
        style={{
          backgroundColor: preset.surfaceColor,
          borderColor: preset.foregroundColor + "22",
          color: preset.foregroundColor,
          fontFamily: serif ? 'Georgia, "Times New Roman", serif' : undefined,
        }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[6px] uppercase tracking-[0.14em] opacity-70">
          <span className="font-semibold">{preset.name}</span>
          <span className="flex gap-2">
            <span>Accueil</span>
            <span>Boutique</span>
            <span>Contact</span>
          </span>
        </div>

        <div
          className="flex flex-1 flex-col justify-center px-4 py-3"
          style={{
            background: `linear-gradient(135deg, ${preset.accentColor}33, transparent)`,
          }}
        >
          <span
            className="text-[6px] uppercase tracking-[0.18em]"
            style={{ color: preset.accentColor }}
          >
            Nouveautés
          </span>
          <p className="mt-1 max-w-[70%] text-[0.75rem] font-medium leading-tight">
            Une boutique à ton image.
          </p>
          <span
            className="mt-2 w-fit rounded-full px-2 py-1 text-[5px] font-semibold text-white"
            style={{ backgroundColor: preset.accentColor }}
          >
            Découvrir
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
          {[0, 1, 2, 3].map((item) => (
            <div key={item}>
              <div
                className="aspect-[4/5] rounded"
                style={{ backgroundColor: preset.foregroundColor + "12" }}
              />
              <p className="mt-1 text-[4.5px] opacity-70">Produit</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
