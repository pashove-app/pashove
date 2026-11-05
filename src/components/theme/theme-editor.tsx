"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { saveThemeAction } from "@/lib/theme/actions";
import { DEFAULT_THEME, THEME_PRESETS, presetById } from "@/lib/theme/presets";
import { themeStyle } from "@/lib/theme/style";
import { getBlockCopy } from "@/lib/theme/copy";
import { BlockEditor } from "@/components/theme/block-editor";
import type {
  StoreTheme,
  ThemeFont,
  ThemePresetId,
  ThemeSectionKey,
} from "@/lib/theme/types";

type Labels = Dictionary["dashboard"]["theme"];

const FONTS: ThemeFont[] = ["sans", "serif", "mono"];

export function ThemeEditor({
  storeId,
  slug,
  locale,
  initialTheme,
  labels,
}: {
  storeId: string;
  slug: string;
  locale: Locale;
  initialTheme: StoreTheme;
  labels: Labels;
}) {
  const router = useRouter();
  const [theme, setTheme] = useState(initialTheme);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const storefront = path(locale, `/store/${slug}`);
  const preset = presetById(theme.preset);
  const blockCopy = getBlockCopy(locale);

  function update(patch: Partial<StoreTheme>) {
    setTheme((current) => ({ ...current, ...patch }));
    setStatus("idle");
  }

  function choosePreset(id: ThemePresetId) {
    const next = presetById(id);
    update({
      preset: id,
      accentColor: next.accentColor,
      backgroundColor: next.backgroundColor,
      surfaceColor: next.surfaceColor,
      foregroundColor: next.foregroundColor,
      font: next.font,
    });
  }

  function setSection(key: ThemeSectionKey, enabled: boolean) {
    update({
      sections: theme.sections.map((section) =>
        section.key === key ? { ...section, enabled } : section,
      ),
    });
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= theme.sections.length) return;

    const next = [...theme.sections];
    [next[index], next[target]] = [next[target], next[index]];
    update({ sections: next });
  }

  async function save() {
    if (pending) return;
    setPending(true);
    setStatus("idle");

    const result = await saveThemeAction(storeId, theme);
    setPending(false);

    if (!result.ok) {
      setStatus("error");
      return;
    }

    if (result.theme) setTheme(result.theme);
    setStatus("saved");
    router.refresh();
  }

  const sectionLabel: Record<ThemeSectionKey, string> = {
    products: labels.sectionProducts,
    collections: labels.sectionCollections,
    bundles: labels.sectionBundles,
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href={path(locale, "/app/online-store/themes")}
            className="text-[0.75rem] font-medium text-accent hover:underline"
          >
            ← {labels.library}
          </Link>
          <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
            {labels.title}
          </h1>
          <p className="mt-1 text-[0.875rem] text-subtle">{labels.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={storefront}
            target="_blank"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-[0.8125rem] font-medium text-body transition-colors hover:border-border-strong hover:text-fg"
          >
            <Icon path={icons.store} className="h-4 w-4" strokeWidth={1.8} />
            {labels.preview}
          </Link>
          <button
            type="button"
            onClick={() => void save()}
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-500 px-5 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {pending ? <Spinner /> : null}
            {pending ? labels.saving : labels.save}
          </button>
        </div>
      </div>

      {status !== "idle" ? (
        <p
          role={status === "error" ? "alert" : "status"}
          className={cn(
            "mt-4 rounded-xl px-3 py-2 text-[0.75rem] font-medium",
            status === "error"
              ? "border border-red-400/25 bg-red-400/[0.07] text-red-600 dark:text-red-400"
              : "border border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-700 dark:text-emerald-300",
          )}
        >
          {status === "error" ? labels.saveError : labels.saved}
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
        <div className="space-y-5">
          <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-[0.9375rem] font-medium text-fg">{labels.presets}</h2>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {THEME_PRESETS.map((entry) => {
                const active = theme.preset === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => choosePreset(entry.id)}
                    className={cn(
                      "rounded-2xl border p-4 text-start transition-colors",
                      active
                        ? "border-brand-500 bg-brand-500/[0.07]"
                        : "border-border bg-bg hover:border-border-strong",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[0.875rem] font-medium text-fg">
                        {labels[
                          `preset${entry.id[0].toUpperCase()}${entry.id.slice(1)}` as keyof Labels
                        ] as string}
                      </span>
                      <span className="flex gap-1">
                        <span
                          className="h-4 w-4 rounded-full border border-black/10"
                          style={{ backgroundColor: entry.backgroundColor }}
                        />
                        <span
                          className="h-4 w-4 rounded-full border border-black/10"
                          style={{ backgroundColor: entry.accentColor }}
                        />
                        <span
                          className="h-4 w-4 rounded-full border border-black/10"
                          style={{ backgroundColor: entry.foregroundColor }}
                        />
                      </span>
                    </span>
                    <span className="mt-1 block text-[0.75rem] leading-relaxed text-subtle">
                      {entry.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-[0.9375rem] font-medium text-fg">{labels.colors}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ColorField
                label={labels.accent}
                value={theme.accentColor}
                onChange={(value) => update({ accentColor: value })}
              />
              <ColorField
                label={labels.background}
                value={theme.backgroundColor}
                onChange={(value) => update({ backgroundColor: value })}
              />
              <ColorField
                label={labels.surface}
                value={theme.surfaceColor}
                onChange={(value) => update({ surfaceColor: value })}
              />
              <ColorField
                label={labels.foreground}
                value={theme.foregroundColor}
                onChange={(value) => update({ foregroundColor: value })}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-[0.9375rem] font-medium text-fg">{labels.font}</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {FONTS.map((font) => (
                <button
                  key={font}
                  type="button"
                  onClick={() => update({ font })}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-[0.8125rem] font-medium transition-colors",
                    theme.font === font
                      ? "border-brand-500 bg-brand-500/[0.07] text-fg"
                      : "border-border text-subtle hover:border-border-strong hover:text-fg",
                  )}
                  style={{
                    fontFamily:
                      font === "serif"
                        ? 'Georgia, "Times New Roman", serif'
                        : font === "mono"
                          ? 'ui-monospace, "SF Mono", monospace'
                          : undefined,
                  }}
                >
                  {font === "sans"
                    ? labels.fontSans
                    : font === "serif"
                      ? labels.fontSerif
                      : labels.fontMono}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-[0.9375rem] font-medium text-fg">{labels.sections}</h2>
            <ul className="mt-4 divide-y divide-hairline">
              {theme.sections.map((section, index) => (
                <li key={section.key} className="flex items-center gap-3 py-3">
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={(event) =>
                      setSection(section.key, event.target.checked)
                    }
                    className="h-4 w-4 rounded border-border accent-[var(--color-brand-500)]"
                    aria-label={sectionLabel[section.key]}
                  />
                  <span className="min-w-0 flex-1 text-[0.8125rem] font-medium text-fg">
                    {sectionLabel[section.key]}
                  </span>
                  <button
                    type="button"
                    onClick={() => moveSection(index, -1)}
                    disabled={index === 0}
                    aria-label="Monter"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-faint hover:bg-hairline hover:text-fg disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(index, 1)}
                    disabled={index === theme.sections.length - 1}
                    aria-label="Descendre"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-faint hover:bg-hairline hover:text-fg disabled:opacity-30"
                  >
                    ↓
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.75rem] leading-relaxed text-subtle">
              {labels.heroHint}{" "}
              <Link
                href={path(locale, "/app/settings/store")}
                className="font-medium text-accent hover:underline"
              >
                {labels.settings}
              </Link>
            </p>
          </section>

          <BlockEditor
            blocks={theme.blocks}
            onChange={(blocks) => update({ blocks })}
            copy={blockCopy}
          />

          <button
            type="button"
            onClick={() => {
              update({
                preset: DEFAULT_THEME.preset,
                accentColor: DEFAULT_THEME.accentColor,
                backgroundColor: DEFAULT_THEME.backgroundColor,
                surfaceColor: DEFAULT_THEME.surfaceColor,
                foregroundColor: DEFAULT_THEME.foregroundColor,
                font: DEFAULT_THEME.font,
                sections: DEFAULT_THEME.sections,
                blocks: [],
              });
              setStatus("idle");
            }}
            className="text-[0.75rem] font-medium text-subtle transition-colors hover:text-fg"
          >
            {labels.reset}
          </button>
        </div>

        <aside className="lg:sticky lg:top-6">
          <p className="mb-2 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-faint">
            {labels.preview}
          </p>
          <div
            className="overflow-hidden rounded-3xl border border-border p-4 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.8)]"
            style={themeStyle(theme)}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.8125rem] font-semibold text-fg">
                {slug}
              </span>
              <span className="h-6 w-6 rounded-full bg-brand-500" />
            </div>
            <div className="mt-4 rounded-2xl bg-surface p-4">
              <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.16em] text-subtle">
                Nouveautés
              </p>
              <p className="mt-1 text-[1.25rem] font-medium leading-tight text-fg">
                {preset.name}
              </p>
              <p className="mt-1 text-[0.6875rem] leading-relaxed text-muted">
                Une vitrine à ton image.
              </p>
              <span className="mt-3 inline-flex rounded-full bg-brand-500 px-3 py-1.5 text-[0.625rem] font-semibold text-white">
                Découvrir
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[0, 1].map((index) => (
                <div key={index} className="rounded-xl bg-surface p-2">
                  <div className="aspect-[4/5] rounded-lg bg-surface-3" />
                  <p className="mt-2 truncate text-[0.625rem] font-medium text-fg">
                    Produit {index + 1}
                  </p>
                  <p className="text-[0.5625rem] text-subtle">10 000 FCFA</p>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[0.6875rem] leading-relaxed text-faint">
            {labels.heroHint}
          </p>
        </aside>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2">
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        className="h-7 w-7 cursor-pointer rounded-md border-0 bg-transparent p-0"
        aria-label={label}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[0.6875rem] text-subtle">{label}</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          maxLength={7}
          className="mt-0.5 w-full bg-transparent font-mono text-[0.75rem] uppercase text-fg outline-none"
          aria-label={label}
        />
      </span>
    </label>
  );
}
