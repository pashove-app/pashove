"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BlockPanel } from "@/components/theme/block-panel";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { saveThemeAction } from "@/lib/theme/actions";
import { DEFAULT_THEME, THEME_PRESETS, presetById } from "@/lib/theme/presets";
import { themeStyle } from "@/lib/theme/style";
import { getBlockCopy } from "@/lib/theme/copy";
import type {
  StoreTheme,
  ThemeBlock,
  ThemeBlockType,
  ThemeFont,
  ThemePresetId,
  ThemeSectionKey,
} from "@/lib/theme/types";

type Labels = Dictionary["dashboard"]["theme"];
type Panel =
  | { kind: "sections" }
  | { kind: "theme" }
  | { kind: "add" }
  | { kind: "block"; index: number };

const FONTS: ThemeFont[] = ["sans", "serif", "mono"];
const BLOCK_TYPES: ThemeBlockType[] = [
  "text",
  "image",
  "video",
  "newsletter",
  "faq",
  "testimonials",
];

function newBlock(type: ThemeBlockType): ThemeBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    enabled: true,
    title: "",
    body: "",
    imageUrl: "",
    videoUrl: "",
    ctaLabel: "",
    ctaHref: "",
    items: [],
  };
}

export function ThemeEditor({
  storeId,
  slug,
  storeName,
  products,
  locale,
  initialTheme,
  labels,
}: {
  storeId: string;
  slug: string;
  storeName: string;
  products: { name: string; priceLabel: string; imageUrl: string | null }[];
  locale: Locale;
  initialTheme: StoreTheme;
  labels: Labels;
}) {
  const router = useRouter();
  const [theme, setTheme] = useState(initialTheme);
  const [panel, setPanel] = useState<Panel>({ kind: "sections" });
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const blockCopy = getBlockCopy(locale);
  const storefront = path(locale, `/store/${slug}`);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function update(patch: Partial<StoreTheme>) {
    setTheme((current) => ({ ...current, ...patch }));
    setStatus("idle");
  }

  function choosePreset(id: ThemePresetId) {
    const preset = presetById(id);
    update({
      preset: id,
      accentColor: preset.accentColor,
      backgroundColor: preset.backgroundColor,
      surfaceColor: preset.surfaceColor,
      foregroundColor: preset.foregroundColor,
      font: preset.font,
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

  function addBlock(type: ThemeBlockType) {
    const next = [...theme.blocks, newBlock(type)];
    update({ blocks: next });
    setPanel({ kind: "block", index: next.length - 1 });
  }

  function patchBlock(index: number, patch: Partial<ThemeBlock>) {
    update({
      blocks: theme.blocks.map((block, i) =>
        i === index ? { ...block, ...patch } : block,
      ),
    });
  }

  function removeBlock(index: number) {
    update({ blocks: theme.blocks.filter((_, i) => i !== index) });
    setPanel({ kind: "sections" });
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= theme.blocks.length) return;
    const next = [...theme.blocks];
    [next[index], next[target]] = [next[target], next[index]];
    update({ blocks: next });
    if (panel.kind === "block" && panel.index === index) {
      setPanel({ kind: "block", index: target });
    }
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

  const activeBlock =
    panel.kind === "block" ? theme.blocks[panel.index] : null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-[#f4f4f6] text-[#1d1d1f]"
      style={{ colorScheme: "light" }}
    >
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#e3e3e7] bg-white px-3 sm:px-4">
        <Link
          href={path(locale, "/app/online-store/themes")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5f5f66] transition-colors hover:bg-[#f1f1f3]"
          aria-label={labels.library}
          title={labels.library}
        >
          <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180" strokeWidth={1.8} />
        </Link>

        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-[#1d1d1f]">
            {storeName}
          </span>
          <span className="hidden rounded-full bg-[#e8f5ec] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#1f7a43] sm:inline-flex">
            Actif
          </span>
        </div>

        <div className="mx-auto hidden items-center gap-1 rounded-lg border border-[#e3e3e7] bg-[#fafafa] px-2.5 py-1.5 sm:flex">
          <span className="text-[11px] font-medium text-[#4b4b52]">
            Page d’accueil
          </span>
          <Icon path={icons.chevronDown} className="h-3 w-3 text-[#8a8a92]" strokeWidth={2} />
        </div>

        <div className="ms-auto flex items-center gap-1.5">
          <div className="hidden items-center rounded-lg border border-[#e3e3e7] bg-[#fafafa] p-0.5 md:flex">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              aria-label="Aperçu ordinateur"
              className={cn(
                "flex h-7 w-8 items-center justify-center rounded-md transition-colors",
                device === "desktop"
                  ? "bg-white text-[#1d1d1f] shadow-sm"
                  : "text-[#8a8a92]",
              )}
            >
              <Icon path={icons.monitor} className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              aria-label="Aperçu mobile"
              className={cn(
                "flex h-7 w-8 items-center justify-center rounded-md transition-colors",
                device === "mobile"
                  ? "bg-white text-[#1d1d1f] shadow-sm"
                  : "text-[#8a8a92]",
              )}
            >
              <Icon path={icons.phone} className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
          </div>

          <Link
            href={storefront}
            target="_blank"
            className="hidden h-8 items-center gap-1.5 rounded-lg border border-[#e3e3e7] px-2.5 text-[11px] font-medium text-[#4b4b52] transition-colors hover:bg-[#f7f7f8] sm:inline-flex"
          >
            <Icon path={icons.arrowUpRight} className="h-3 w-3" strokeWidth={1.8} />
            Voir
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e3e3e7] px-2.5 text-[11px] font-medium text-[#4b4b52] lg:hidden"
          >
            Sections
          </button>

          <button
            type="button"
            onClick={() => void save()}
            disabled={pending}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#1d1d1f] px-3 text-[11px] font-semibold text-white transition-colors hover:bg-black disabled:opacity-60"
          >
            {pending ? <Spinner /> : null}
            {pending ? labels.saving : labels.save}
          </button>
        </div>
      </header>

      {status !== "idle" ? (
        <div
          className={cn(
            "flex h-8 shrink-0 items-center justify-center gap-2 text-[11px] font-medium",
            status === "error"
              ? "bg-[#fef2f2] text-[#b42318]"
              : "bg-[#edf9f1] text-[#1f7a43]",
          )}
        >
          <Icon path={icons.check} className="h-3.5 w-3.5" strokeWidth={2.2} />
          {status === "error" ? labels.saveError : labels.saved}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "flex w-[19rem] shrink-0 flex-col border-e border-[#e3e3e7] bg-white transition-transform max-lg:absolute max-lg:inset-y-0 max-lg:start-0 max-lg:z-30 max-lg:w-[19rem] max-lg:shadow-2xl",
            sidebarOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
          )}
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            {panel.kind === "sections" ? (
              <SectionsPanel
                theme={theme}
                labels={labels}
                sectionLabel={sectionLabel}
                blockCopy={blockCopy}
                onTheme={() => setPanel({ kind: "theme" })}
                onAdd={() => setPanel({ kind: "add" })}
                onBlock={(index) => {
                  setPanel({ kind: "block", index });
                  setSidebarOpen(true);
                }}
                onMoveBlock={moveBlock}
                setSection={setSection}
                moveSection={moveSection}
                locale={locale}
              />
            ) : null}

            {panel.kind === "theme" ? (
              <ThemePanel
                theme={theme}
                labels={labels}
                update={update}
                choosePreset={choosePreset}
                onBack={() => setPanel({ kind: "sections" })}
              />
            ) : null}

            {panel.kind === "add" ? (
              <AddPanel
                copy={blockCopy}
                onBack={() => setPanel({ kind: "sections" })}
                onAdd={addBlock}
              />
            ) : null}

            {activeBlock && panel.kind === "block" ? (
              <BlockPanel
                block={activeBlock}
                copy={blockCopy}
                onChange={(patch) => patchBlock(panel.index, patch)}
                onBack={() => setPanel({ kind: "sections" })}
                onDelete={() => removeBlock(panel.index)}
              />
            ) : null}
          </div>
        </aside>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-auto bg-[#ececef] p-4 sm:p-7">
            <div
              className={cn(
                "mx-auto transition-[width] duration-300",
                device === "mobile" ? "w-full max-w-[390px]" : "w-full max-w-[1180px]",
              )}
            >
              <div className="overflow-hidden rounded-xl border border-[#d9d9de] bg-white shadow-[0_18px_50px_-30px_rgba(0,0,0,0.35)]">
                <div className="flex h-9 items-center gap-2 border-b border-[#e9e9ec] bg-[#fafafa] px-3">
                  <span className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#e3a6a3]" />
                    <span className="h-2 w-2 rounded-full bg-[#e5d3a3]" />
                    <span className="h-2 w-2 rounded-full bg-[#a9d3b4]" />
                  </span>
                  <span className="mx-auto max-w-[60%] truncate rounded-md bg-white px-3 py-1 text-[9px] text-[#8a8a92]">
                    {storeName.toLowerCase().replace(/\s+/g, "-")}.pashove.com
                  </span>
                </div>

                <div className="min-h-[620px]" style={themeStyle(theme)}>
                  <Preview theme={theme} storeName={storeName} products={products} />
                </div>
              </div>
            </div>
          </div>

          {sidebarOpen ? (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 z-20 bg-black/20 lg:hidden"
              aria-label="Fermer le panneau"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SectionGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-[#ededf0] px-3 py-3">
      <p className="px-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8a8a92]">
        {title}
      </p>
      <div className="mt-1 space-y-0.5">{children}</div>
    </div>
  );
}

function SectionRow({
  label,
  icon,
  muted,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  muted?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-start text-[11px] font-medium transition-colors",
        muted ? "text-[#8a8a92]" : "text-[#4b4b52] hover:bg-[#f5f5f7]",
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded border border-[#e3e3e7] bg-white text-[#77777f]">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {onClick ? (
        <Icon path={icons.chevronDown} className="h-3 w-3 rotate-[-90deg] text-[#a0a0a8]" strokeWidth={2} />
      ) : null}
    </button>
  );
}

function SectionsPanel({
  theme,
  labels,
  sectionLabel,
  blockCopy,
  onTheme,
  onAdd,
  onBlock,
  onMoveBlock,
  setSection,
  moveSection,
  locale,
}: {
  theme: StoreTheme;
  labels: Labels;
  sectionLabel: Record<ThemeSectionKey, string>;
  blockCopy: ReturnType<typeof getBlockCopy>;
  onTheme: () => void;
  onAdd: () => void;
  onBlock: (index: number) => void;
  onMoveBlock: (index: number, direction: -1 | 1) => void;
  setSection: (key: ThemeSectionKey, enabled: boolean) => void;
  moveSection: (index: number, direction: -1 | 1) => void;
  locale: Locale;
}) {
  return (
    <div>
      <div className="px-4 pb-2 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8a92]">
          Page
        </p>
        <h2 className="mt-1 text-[14px] font-semibold text-[#1d1d1f]">
          Page d’accueil
        </h2>
      </div>

      <SectionGroup title="En-tête">
        <SectionRow label="Barre d’annonces" icon={<span className="text-[9px]">Aa</span>} muted />
        <SectionRow label="En-tête" icon={<span className="text-[9px]">H</span>} muted />
        <SectionRow label="Ajouter une section" icon={<Icon path={icons.plus} className="h-3 w-3" />} onClick={onAdd} />
      </SectionGroup>

      <SectionGroup title="Modèle">
        <SectionRow
          label="Bannière principale"
          icon={<span className="text-[9px]">▣</span>}
          onClick={() => {
            window.location.href = path(locale, "/app/settings/store");
          }}
        />
        {theme.sections.map((section, index) => (
          <div
            key={section.key}
            className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#f5f5f7]"
          >
            <input
              type="checkbox"
              checked={section.enabled}
              onChange={(event) => setSection(section.key, event.target.checked)}
              aria-label={sectionLabel[section.key]}
              className="h-3.5 w-3.5 accent-[#2f5cff]"
            />
            <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#4b4b52]">
              {sectionLabel[section.key]}
            </span>
            <button
              type="button"
              onClick={() => moveSection(index, -1)}
              disabled={index === 0}
              aria-label="Monter"
              className="flex h-5 w-5 items-center justify-center rounded text-[#a0a0a8] hover:bg-white disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => moveSection(index, 1)}
              disabled={index === theme.sections.length - 1}
              aria-label="Descendre"
              className="flex h-5 w-5 items-center justify-center rounded text-[#a0a0a8] hover:bg-white disabled:opacity-30"
            >
              ↓
            </button>
          </div>
        ))}
      </SectionGroup>

      <SectionGroup title="Pied de page">
        <SectionRow label="Pied de page" icon={<span className="text-[9px]">F</span>} muted />
      </SectionGroup>

      <SectionGroup title="Sections personnalisées">
        {theme.blocks.length === 0 ? (
          <p className="px-2 py-2 text-[10px] leading-relaxed text-[#8a8a92]">
            {blockCopy.empty}
          </p>
        ) : (
          theme.blocks.map((block, index) => (
            <div
              key={block.id}
              className="group flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-[#f5f5f7]"
            >
              <button
                type="button"
                onClick={() => onBlock(index)}
                className="min-w-0 flex-1 truncate text-start text-[11px] font-medium text-[#4b4b52]"
              >
                {block.title || blockCopy.types[block.type]}
              </button>
              <button
                type="button"
                onClick={() => onMoveBlock(index, -1)}
                disabled={index === 0}
                aria-label="Monter"
                className="flex h-5 w-5 items-center justify-center rounded text-[#a0a0a8] hover:bg-white disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onMoveBlock(index, 1)}
                disabled={index === theme.blocks.length - 1}
                aria-label="Descendre"
                className="flex h-5 w-5 items-center justify-center rounded text-[#a0a0a8] hover:bg-white disabled:opacity-30"
              >
                ↓
              </button>
            </div>
          ))
        )}
        <SectionRow
          label="Ajouter une section"
          icon={<Icon path={icons.plus} className="h-3 w-3" />}
          onClick={onAdd}
        />
      </SectionGroup>

      <div className="p-3">
        <button
          type="button"
          onClick={onTheme}
          className="flex w-full items-center justify-between rounded-lg border border-[#e3e3e7] px-3 py-2.5 text-[11px] font-medium text-[#4b4b52] hover:bg-[#f7f7f8]"
        >
          <span className="flex items-center gap-2">
            <Icon path={icons.palette} className="h-3.5 w-3.5" strokeWidth={1.8} />
            {labels.presets}
          </span>
          <Icon path={icons.chevronDown} className="h-3 w-3 rotate-[-90deg]" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function ThemePanel({
  theme,
  labels,
  update,
  choosePreset,
  onBack,
}: {
  theme: StoreTheme;
  labels: Labels;
  update: (patch: Partial<StoreTheme>) => void;
  choosePreset: (id: ThemePresetId) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <PanelHeader title={labels.title} onBack={onBack} />
      <div className="space-y-4 p-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#77777f]">
            {labels.presets}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => choosePreset(preset.id)}
                className={cn(
                  "rounded-lg border p-2 text-start transition-colors",
                  theme.preset === preset.id
                    ? "border-[#2f5cff] ring-1 ring-[#2f5cff]"
                    : "border-[#e3e3e7] hover:border-[#c9c9cf]",
                )}
              >
                <span
                  className="block h-9 rounded-md"
                  style={{
                    background: `linear-gradient(135deg, ${preset.backgroundColor}, ${preset.accentColor})`,
                  }}
                />
                <span className="mt-1.5 block text-[10px] font-semibold text-[#1d1d1f]">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#77777f]">
            {labels.colors}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <ColorField label={labels.accent} value={theme.accentColor} onChange={(value) => update({ accentColor: value })} />
            <ColorField label={labels.background} value={theme.backgroundColor} onChange={(value) => update({ backgroundColor: value })} />
            <ColorField label={labels.surface} value={theme.surfaceColor} onChange={(value) => update({ surfaceColor: value })} />
            <ColorField label={labels.foreground} value={theme.foregroundColor} onChange={(value) => update({ foregroundColor: value })} />
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#77777f]">
            {labels.font}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {FONTS.map((font) => (
              <button
                key={font}
                type="button"
                onClick={() => update({ font })}
                className={cn(
                  "rounded-lg border px-1.5 py-2 text-[10px] font-medium transition-colors",
                  theme.font === font
                    ? "border-[#2f5cff] bg-[#eef2ff] text-[#2f5cff]"
                    : "border-[#e3e3e7] text-[#4b4b52] hover:border-[#c9c9cf]",
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
                {font === "sans" ? labels.fontSans : font === "serif" ? labels.fontSerif : labels.fontMono}
              </button>
            ))}
          </div>
        </div>

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
          }}
          className="text-[10px] font-medium text-[#8a8a92] hover:text-[#1d1d1f]"
        >
          {labels.reset}
        </button>
      </div>
    </div>
  );
}

function PanelHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[#e5e5e8] bg-white px-3 py-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Retour"
        className="flex h-7 w-7 items-center justify-center rounded-md text-[#5f5f66] hover:bg-[#f1f1f3]"
      >
        <Icon path={icons.arrowRight} className="h-3.5 w-3.5 rotate-180" strokeWidth={1.8} />
      </button>
      <p className="text-[12px] font-semibold text-[#1d1d1f]">{title}</p>
    </div>
  );
}

function AddPanel({
  copy,
  onBack,
  onAdd,
}: {
  copy: ReturnType<typeof getBlockCopy>;
  onBack: () => void;
  onAdd: (type: ThemeBlockType) => void;
}) {
  return (
    <div>
      <PanelHeader title={copy.add} onBack={onBack} />
      <div className="grid gap-2 p-3">
        {BLOCK_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className="flex items-center justify-between rounded-lg border border-[#e3e3e7] px-3 py-2.5 text-[11px] font-medium text-[#4b4b52] transition-colors hover:border-[#2f5cff] hover:text-[#2f5cff]"
          >
            {copy.types[type]}
            <Icon path={icons.plus} className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Preview({
  theme,
  storeName,
  products,
}: {
  theme: StoreTheme;
  storeName: string;
  products: { name: string; priceLabel: string; imageUrl: string | null }[];
}) {
  const blocks = theme.blocks.filter((block) => block.enabled);

  return (
    <div className="min-h-[620px] bg-bg text-fg">
      <div className="bg-brand-500 px-4 py-1.5 text-center text-[8px] font-semibold uppercase tracking-[0.12em] text-white">
        Livraison offerte dès 25 000 FCFA
      </div>

      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <span className="text-[13px] font-semibold tracking-[-0.03em]">{storeName}</span>
        <span className="hidden gap-5 text-[8px] font-semibold uppercase tracking-[0.12em] text-subtle sm:flex">
          <span>Accueil</span>
          <span>Collections</span>
          <span>Nouveautés</span>
          <span>Contact</span>
        </span>
        <span className="flex gap-2 text-faint">
          <Icon path={icons.search} className="h-3.5 w-3.5" strokeWidth={1.8} />
          <Icon path={icons.user} className="h-3.5 w-3.5" strokeWidth={1.8} />
          <Icon path={icons.bag} className="h-3.5 w-3.5" strokeWidth={1.8} />
        </span>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-brand-500/25 via-panel-mid to-bg px-7 py-12">
        <div className="absolute -end-16 -top-20 h-52 w-52 rounded-full bg-brand-500/20 blur-3xl" />
        <p className="relative text-[8px] font-semibold uppercase tracking-[0.2em] text-accent">
          Nouveautés
        </p>
        <h1 className="relative mt-2 max-w-sm text-[28px] font-medium leading-[1.1] tracking-[-0.04em]">
          L’élégance qui te ressemble.
        </h1>
        <p className="relative mt-2 max-w-xs text-[10px] leading-relaxed text-muted">
          Des pièces choisies avec soin, livrées chez toi.
        </p>
        <span className="relative mt-4 inline-flex rounded-full bg-brand-500 px-4 py-2 text-[9px] font-semibold text-white">
          Découvrir la boutique
        </span>
      </div>

      <div className="px-5 py-7">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-faint">
              La sélection
            </p>
            <h2 className="mt-1 text-[18px] font-medium tracking-[-0.03em]">
              Produits
            </h2>
          </div>
          <span className="text-[8px] text-accent">Tout voir</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(products.length > 0
            ? products
            : [1, 2, 3, 4].map((item) => ({
                name: `Produit ${item}`,
                priceLabel: "12 000 FCFA",
                imageUrl: null,
              }))
          ).map((product, index) => (
            <div key={`${product.name}-${index}`}>
              <div className="aspect-[4/5] overflow-hidden rounded-lg bg-surface-3">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-500/25 via-surface-3 to-surface-2">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-subtle">
                      Photo
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-2 truncate text-[9px] font-medium">{product.name}</p>
              <p className="text-[8px] text-subtle">{product.priceLabel}</p>
            </div>
          ))}
        </div>
      </div>

      {blocks.map((block) => (
        <div key={block.id} className="border-t border-border px-5 py-7">
          {block.type === "image" && block.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.imageUrl} alt="" className="mb-4 max-h-48 w-full rounded-lg object-cover" />
          ) : null}
          <h3 className="text-[16px] font-medium tracking-[-0.02em]">
            {block.title || block.body.slice(0, 40) || "Section"}
          </h3>
          {block.body ? (
            <p className="mt-1.5 max-w-md text-[10px] leading-relaxed text-muted">
              {block.body}
            </p>
          ) : null}
          {block.type === "video" && block.videoUrl ? (
            <div className="mt-3 flex aspect-video items-center justify-center rounded-lg border border-border bg-black/40 text-white">
              <Icon path={icons.play} className="h-7 w-7" />
            </div>
          ) : null}
          {block.type === "faq"
            ? block.items.slice(0, 3).map((item, index) => (
                <div key={index} className="mt-2 border-b border-border pb-2 text-[9px]">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-0.5 text-muted">{item.text}</p>
                </div>
              ))
            : null}
          {block.type === "testimonials" ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {block.items.slice(0, 2).map((item, index) => (
                <div key={index} className="rounded-lg border border-border p-2.5 text-[9px]">
                  <p className="italic text-muted">“{item.text}”</p>
                  <p className="mt-1 font-medium">{item.title}</p>
                </div>
              ))}
            </div>
          ) : null}
          {block.type === "newsletter" ? (
            <div className="mt-3 flex gap-2">
              <span className="h-7 flex-1 rounded-full border border-border px-3 text-[8px] leading-7 text-faint">
                Adresse e-mail
              </span>
              <span className="rounded-full bg-brand-500 px-3 text-[8px] leading-7 text-white">
                S’inscrire
              </span>
            </div>
          ) : null}
          {block.ctaLabel && block.type !== "faq" && block.type !== "testimonials" ? (
            <span className="mt-3 inline-flex rounded-full border border-border px-3 py-1.5 text-[8px] font-medium">
              {block.ctaLabel}
            </span>
          ) : null}
        </div>
      ))}

      <div className="border-t border-border px-5 py-6">
        <p className="text-[12px] font-semibold">{storeName}</p>
        <p className="mt-1 text-[8px] text-subtle">
          Paiement à la livraison · Livraison suivie
        </p>
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
    <label className="flex items-center gap-2 rounded-lg border border-[#e3e3e7] bg-white px-2 py-1.5">
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
        aria-label={label}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[9px] text-[#8a8a92]">{label}</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          maxLength={7}
          className="mt-0.5 w-full bg-transparent font-mono text-[10px] uppercase text-[#1d1d1f] outline-none"
          aria-label={label}
        />
      </span>
    </label>
  );
}
