"use client";

import { useRef, useState } from "react";
import type {
  FieldSchema,
  FieldTab,
  SettingValue,
  ThemeBlockInstance,
  ThemeSectionInstance,
  ThemeSettings,
  ThemePalette,
} from "@/lib/theme-editor/types";
import { FIELD_TABS } from "@/lib/theme-editor/types";
import { BLOCK_SCHEMAS, getBlockSchema, getSectionSchema } from "@/lib/theme-editor/schema";
import {
  STYLE_PRESETS,
  blockTypesForSection,
  newBlock,
} from "@/lib/theme-editor/defaults";
import type { ThemeProductCard, ThemeCollectionCard, ThemeMetafieldOption } from "@/components/theme-editor/types";
import { cn } from "@/lib/cn";

export type EditorFieldContext = {
  storeId: string;
  storeSlug: string;
  products: ThemeProductCard[];
  collections: ThemeCollectionCard[];
  metafields: ThemeMetafieldOption[];
  settings: ThemeSettings;
  onCreateMetafield?: (ownerType: string, ownerId: string, key: string, value: string) => Promise<ThemeMetafieldOption | null>;
};

function labelClass() {
  return "text-[0.6875rem] font-semibold text-subtle";
}

function inputClass() {
  return "h-10 w-full rounded-xl border border-border bg-bg-soft px-3 text-[0.8125rem] text-fg outline-none transition-colors placeholder:text-faint focus:border-brand-500";
}

/* ------------------------------------------------------------------ *
 *  Upload d'image
 * ------------------------------------------------------------------ */

async function uploadImage(file: File): Promise<string | null> {
  const presign = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      kind: "banner",
      contentType: file.type,
      size: file.size,
    }),
  });

  if (!presign.ok) return null;
  const signed = (await presign.json()) as {
    uploadUrl?: string;
    key?: string;
    publicUrl?: string;
  };
  if (!signed.uploadUrl || !signed.key) return null;

  const put = await fetch(signed.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!put.ok) return null;

  const complete = await fetch("/api/uploads/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key: signed.key }),
  });
  if (!complete.ok) return null;

  return signed.publicUrl ?? null;
}

/* ------------------------------------------------------------------ *
 *  Champ unitaire
 * ------------------------------------------------------------------ */

export function FieldControl({
  field,
  value,
  context,
  onChange,
  compact = false,
}: {
  field: FieldSchema;
  value: SettingValue | undefined;
  context: EditorFieldContext;
  onChange: (value: SettingValue) => void;
  compact?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [metaKey, setMetaKey] = useState("delai_livraison");
  const [metaValue, setMetaValue] = useState("Livraison sous 48 h");
  const [metaOwner, setMetaOwner] = useState<ThemeMetafieldOption["owner"]>("product");
  const [metaOwnerId, setMetaOwnerId] = useState(context.products[0]?.id ?? context.storeId);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const stringValue = typeof value === "string" ? value : "";
  const numberValue = typeof value === "number" ? value : Number(field.defaultValue ?? 0);
  const booleanValue = value === true;
  const isMetafield = value !== null && typeof value === "object" && "$metafield" in value;
  const metafieldRef = isMetafield ? (value as { $metafield: ThemeMetafieldOption & { fallback: string } }).$metafield : null;

  if (field.type === "heading") {
    return <p className="mt-4 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">{field.label}</p>;
  }
  if (field.type === "info") {
    return <p className="text-[0.72rem] leading-relaxed text-subtle">{field.help ?? field.label}</p>;
  }

  return (
    <div className={cn("grid gap-1.5", compact && "gap-1")}>
      <div className="flex items-center justify-between gap-2">
        <label className={labelClass()}>{field.label}</label>
        {(field.type === "text" || field.type === "textarea") && !isMetafield ? (
          <button
            type="button"
            className="text-[10px] font-semibold text-brand-400 hover:text-brand-300"
            onClick={() => setShowMeta((open) => !open)}
            title="Connecter une source dynamique"
          >
            ⚡ Source
          </button>
        ) : null}
        {isMetafield ? (
          <button
            type="button"
            className="text-[10px] font-semibold text-emerald-400"
            onClick={() => onChange(field.defaultValue ?? "")}
            title="Déconnecter la source"
          >
            🔗 Connecté · retirer
          </button>
        ) : null}
      </div>

      {isMetafield && metafieldRef ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[0.7rem] text-emerald-300">
          Connecté à <strong>{metafieldRef.owner}</strong> · {metafieldRef.namespace}.{metafieldRef.key}
        </p>
      ) : null}

      {showMeta ? (
        <div className="grid gap-2 rounded-xl border border-brand-500/30 bg-brand-500/5 p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-300">Source dynamique</p>
          <select
            className={inputClass()}
            value={metaOwner}
            onChange={(event) => {
              const owner = event.target.value as ThemeMetafieldOption["owner"];
              setMetaOwner(owner);
              setMetaOwnerId(
                owner === "product"
                  ? context.products[0]?.id ?? context.storeId
                  : owner === "collection"
                    ? context.collections[0]?.id ?? context.storeId
                    : context.storeId,
              );
            }}
          >
            <option value="product">Produit</option>
            <option value="collection">Collection</option>
            <option value="page">Page</option>
            <option value="article">Article</option>
            <option value="shop">Boutique</option>
          </select>
          {metaOwner === "product" && context.products.length > 0 ? (
            <select className={inputClass()} value={metaOwnerId} onChange={(event) => setMetaOwnerId(event.target.value)}>
              {context.products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          ) : null}
          {metaOwner === "collection" && context.collections.length > 0 ? (
            <select className={inputClass()} value={metaOwnerId} onChange={(event) => setMetaOwnerId(event.target.value)}>
              {context.collections.map((collection) => (
                <option key={collection.id} value={collection.id}>{collection.name}</option>
              ))}
            </select>
          ) : null}
          <select
            className={inputClass()}
            value={metafieldRef ? `${metafieldRef.namespace}.${metafieldRef.key}` : ""}
            onChange={(event) => {
              const [namespace, key] = event.target.value.split(".");
              if (!key) return;
              onChange({
                $metafield: {
                  owner: metaOwner as ThemeMetafieldOption["owner"],
                  namespace,
                  key,
                  fallback: stringValue,
                },
              });
              setShowMeta(false);
            }}
          >
            <option value="">Choisir un méta-champ…</option>
            {context.metafields
              .filter((entry) => entry.owner === metaOwner)
              .map((entry) => (
                <option key={`${entry.owner}-${entry.ownerId}-${entry.namespace}.${entry.key}`} value={`${entry.namespace}.${entry.key}`}>
                  {entry.namespace}.{entry.key} — {entry.label}
                </option>
              ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input className={inputClass()} value={metaKey} onChange={(event) => setMetaKey(event.target.value)} placeholder="clé" />
            <input className={inputClass()} value={metaValue} onChange={(event) => setMetaValue(event.target.value)} placeholder="valeur" />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="h-9 flex-1 rounded-xl bg-brand-500 text-[0.7rem] font-semibold text-white"
              onClick={async () => {
                const created = await context.onCreateMetafield?.(metaOwner, metaOwnerId, metaKey, metaValue);
                if (created) {
                  onChange({
                    $metafield: {
                      owner: metaOwner as ThemeMetafieldOption["owner"],
                      namespace: created.namespace,
                      key: created.key,
                      fallback: stringValue,
                    },
                  });
                }
                setShowMeta(false);
              }}
            >
              Créer et connecter
            </button>
            <button type="button" className="h-9 rounded-xl border border-border px-3 text-[0.7rem] text-subtle" onClick={() => setShowMeta(false)}>
              Fermer
            </button>
          </div>
        </div>
      ) : null}

      {field.type === "text" || field.type === "url" || field.type === "video" || field.type === "icon" ? (
        <>
          <input
            className={inputClass()}
            value={stringValue}
            placeholder={field.placeholder}
            onChange={(event) => onChange(event.target.value)}
          />
          {field.key.toLowerCase().endsWith("link") ? (
            <select
              className={inputClass()}
              value=""
              onChange={(event) => {
                if (event.target.value) onChange(event.target.value);
              }}
            >
              <option value="">Choisir une page…</option>
              <option value="/">Accueil</option>
              <option value="/products">Produits</option>
              <option value="/collections">Collections</option>
              <option value="/about">À propos</option>
              <option value="/faq">FAQ</option>
              <option value="/contact">Contact</option>
              <option value="/cart">Panier</option>
              {context.collections.map((collection) => (
                <option key={collection.id} value={`/collections/${collection.slug}`}>
                  Collection · {collection.name}
                </option>
              ))}
              {context.products.slice(0, 30).map((product) => (
                <option key={product.id} value={`/products/${product.slug}`}>
                  Produit · {product.name}
                </option>
              ))}
            </select>
          ) : null}
        </>
      ) : null}

      {field.type === "textarea" || field.type === "css" ? (
        <textarea
          className={cn(inputClass(), "h-auto min-h-24 py-2.5 font-mono text-[0.72rem] leading-relaxed")}
          value={stringValue}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {field.type === "number" ? (
        <input
          type="number"
          className={inputClass()}
          value={numberValue}
          min={field.min}
          max={field.max}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      ) : null}

      {field.type === "range" ? (
        <div className="flex items-center gap-2">
          <input
            type="range"
            className="h-1.5 flex-1 accent-brand-500"
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            value={numberValue}
            onChange={(event) => onChange(Number(event.target.value))}
          />
          <input
            type="number"
            className="h-9 w-20 rounded-lg border border-border bg-bg-soft px-2 text-right text-[0.72rem] text-fg"
            value={numberValue}
            min={field.min}
            max={field.max}
            onChange={(event) => onChange(Number(event.target.value))}
          />
          {field.unit ? <span className="text-[0.65rem] text-faint">{field.unit}</span> : null}
        </div>
      ) : null}

      {field.type === "toggle" ? (
        <button
          type="button"
          role="switch"
          aria-checked={booleanValue}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-xl border px-3 text-[0.72rem] font-medium transition-colors",
            booleanValue ? "border-brand-500 bg-brand-500/10 text-fg" : "border-border bg-bg-soft text-subtle",
          )}
          onClick={() => onChange(!booleanValue)}
        >
          <span>{booleanValue ? "Activé" : "Désactivé"}</span>
          <span className={cn("relative h-5 w-9 rounded-full transition-colors", booleanValue ? "bg-brand-500" : "bg-border")}>
            <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", booleanValue ? "left-4" : "left-0.5")} />
          </span>
        </button>
      ) : null}

      {field.type === "palette" ? (
        <select className={inputClass()} value={stringValue} onChange={(event) => onChange(event.target.value)}>
          <option value="">Palette du thème</option>
          {context.settings.palettes.map((palette) => (
            <option key={palette.id} value={palette.id}>{palette.name}</option>
          ))}
        </select>
      ) : null}

      {field.type === "select" ? (
        <select className={inputClass()} value={stringValue} onChange={(event) => onChange(event.target.value)}>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : null}

      {field.type === "color" ? (
        <div className="flex items-center gap-2">
          <input
            type="color"
            className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-bg-soft p-1"
            value={stringValue || "#000000"}
            onChange={(event) => onChange(event.target.value)}
          />
          <input
            className={inputClass()}
            value={stringValue}
            placeholder="Laisser vide = palette"
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      ) : null}

      {field.type === "image" ? (
        <div className="grid gap-2">
          {stringValue ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={stringValue} alt="" className="h-24 w-full rounded-xl border border-border object-cover" />
          ) : null}
          <div className="flex gap-2">
            <input
              className={inputClass()}
              value={stringValue}
              placeholder="https://… ou envoyer un fichier"
              onChange={(event) => onChange(event.target.value)}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setUploading(true);
                const url = await uploadImage(file);
                setUploading(false);
                if (url) onChange(url);
              }}
            />
            <button
              type="button"
              className="h-10 shrink-0 rounded-xl border border-border px-3 text-[0.7rem] font-medium text-subtle hover:text-fg"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "…" : "Envoyer"}
            </button>
          </div>
        </div>
      ) : null}

      {field.key.toLowerCase().endsWith("productid") ? (
        <select className={inputClass()} value={stringValue} onChange={(event) => onChange(event.target.value)}>
          <option value="">Produit automatique / premier produit</option>
          {context.products.map((product) => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </select>
      ) : null}

      {field.key.toLowerCase().endsWith("collectionid") ? (
        <select className={inputClass()} value={stringValue} onChange={(event) => onChange(event.target.value)}>
          <option value="">Première collection / tous les produits</option>
          {context.collections.map((collection) => (
            <option key={collection.id} value={collection.id}>{collection.name}</option>
          ))}
        </select>
      ) : null}

      {field.help ? <p className="text-[0.65rem] leading-relaxed text-faint">{field.help}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Paramètres d’une section ou d’un bloc
 * ------------------------------------------------------------------ */


export function BlockSettingsPanel({
  block,
  context,
  onChange,
  onDelete,
}: {
  block: ThemeBlockInstance;
  context: EditorFieldContext;
  onChange: (block: ThemeBlockInstance) => void;
  onDelete: () => void;
}) {
  const schema = getBlockSchema(block.type);

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-faint">Bloc</p>
          <p className="mt-1 text-[0.9rem] font-semibold text-fg">{schema?.label ?? block.type}</p>
        </div>
        <button type="button" className="h-9 w-9 rounded-lg border border-red-500/30 text-[11px] text-red-400" title="Supprimer le bloc" onClick={onDelete}>✕</button>
      </div>

      <button
        type="button"
        className={cn("flex h-9 items-center justify-between rounded-xl border px-3 text-[0.7rem]", block.visible ? "border-border bg-bg-soft text-fg" : "border-amber-500/30 bg-amber-500/10 text-amber-300")}
        onClick={() => onChange({ ...block, visible: !block.visible })}
      >
        <span>{block.visible ? "Bloc visible" : "Bloc masqué"}</span>
        <span>{block.visible ? "👁" : "—"}</span>
      </button>

      <div className="grid gap-3">
        {schema?.fields.map((field) => (
          <FieldControl
            key={field.key}
            field={field}
            value={block.settings[field.key]}
            context={context}
            onChange={(value) =>
              onChange({ ...block, settings: { ...block.settings, [field.key]: value } })
            }
          />
        ))}
      </div>
    </div>
  );
}

export function SectionSettingsPanel({
  section,
  context,
  onChange,
  onDelete,
  onDuplicate,
}: {
  section: ThemeSectionInstance;
  context: EditorFieldContext;
  onChange: (section: ThemeSectionInstance) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const schema = getSectionSchema(section.type);
  const [tab, setTab] = useState<FieldTab>("content");
  const tabs = FIELD_TABS.filter((entry) =>
    schema?.fields.some((field) => field.tab === entry.id && field.type !== "heading" && field.type !== "info"),
  );

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-faint">Section</p>
          <input
            className="mt-1 h-9 w-full rounded-lg border border-border bg-bg-soft px-2 text-[0.85rem] font-semibold text-fg"
            value={section.name}
            onChange={(event) => onChange({ ...section, name: event.target.value })}
          />
        </div>
        <div className="flex shrink-0 gap-1">
          <button type="button" className="h-9 w-9 rounded-lg border border-border text-[11px] text-subtle" title="Dupliquer" onClick={onDuplicate}>⧉</button>
          <button type="button" className="h-9 w-9 rounded-lg border border-red-500/30 text-[11px] text-red-400" title="Supprimer" onClick={onDelete}>✕</button>
        </div>
      </div>

      <button
        type="button"
        className={cn("flex h-9 items-center justify-between rounded-xl border px-3 text-[0.7rem]", section.visible ? "border-border bg-bg-soft text-fg" : "border-amber-500/30 bg-amber-500/10 text-amber-300")}
        onClick={() => onChange({ ...section, visible: !section.visible })}
      >
        <span>{section.visible ? "Section visible" : "Section masquée"}</span>
        <span>{section.visible ? "👁" : "—"}</span>
      </button>

      <div className="flex flex-wrap gap-1 border-b border-border pb-2">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={cn(
              "rounded-full px-2.5 py-1.5 text-[0.65rem] font-medium transition-colors",
              tab === entry.id ? "bg-brand-500 text-white" : "text-subtle hover:bg-hairline hover:text-fg",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {schema?.fields
          .filter((field) => field.tab === tab)
          .map((field) => (
            <FieldControl
              key={field.key}
              field={field}
              value={section.settings[field.key]}
              context={context}
              onChange={(value) =>
                onChange({ ...section, settings: { ...section.settings, [field.key]: value } })
              }
            />
          ))}
      </div>

      {schema?.blocks ? (
        <BlockList section={section} context={context} onChange={onChange} />
      ) : null}
    </div>
  );
}

function BlockList({
  section,
  context,
  onChange,
}: {
  section: ThemeSectionInstance;
  context: EditorFieldContext;
  onChange: (section: ThemeSectionInstance) => void;
}) {
  const schema = getSectionSchema(section.type);
  const [adding, setAdding] = useState(false);
  const allowed = blockTypesForSection(section.type);

  if (!schema?.blocks) return null;

  return (
    <div className="grid gap-2 rounded-xl border border-border bg-bg-soft p-3">
      <div className="flex items-center justify-between">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-faint">
          {schema.blocks.name} · {section.blocks.length}/{schema.blocks.limit}
        </p>
        <button type="button" className="text-[10px] font-semibold text-brand-400" onClick={() => setAdding((open) => !open)}>
          + Ajouter
        </button>
      </div>

      {adding ? (
        <div className="grid gap-1 rounded-lg border border-border bg-surface p-2">
          {allowed.map((type) => (
            <button
              key={type}
              type="button"
              className="rounded-lg px-2 py-1.5 text-left text-[0.7rem] text-subtle hover:bg-hairline hover:text-fg"
              onClick={() => {
                if (section.blocks.length >= schema.blocks!.limit) return;
                onChange({ ...section, blocks: [...section.blocks, newBlock(type)] });
                setAdding(false);
              }}
            >
              {BLOCK_SCHEMAS[type]?.label ?? type}
            </button>
          ))}
        </div>
      ) : null}

      {section.blocks.map((block, index) => (
        <BlockEditorRow
          key={block.id}
          block={block}
          context={context}
          onChange={(next) =>
            onChange({
              ...section,
              blocks: section.blocks.map((entry) => (entry.id === block.id ? next : entry)),
            })
          }
          onDelete={() =>
            onChange({ ...section, blocks: section.blocks.filter((entry) => entry.id !== block.id) })
          }
          onMove={(delta) => {
            const target = index + delta;
            if (target < 0 || target >= section.blocks.length) return;
            const blocks = [...section.blocks];
            const [item] = blocks.splice(index, 1);
            blocks.splice(target, 0, item);
            onChange({ ...section, blocks });
          }}
        />
      ))}
    </div>
  );
}

function BlockEditorRow({
  block,
  context,
  onChange,
  onDelete,
  onMove,
}: {
  block: ThemeBlockInstance;
  context: EditorFieldContext;
  onChange: (block: ThemeBlockInstance) => void;
  onDelete: () => void;
  onMove: (delta: number) => void;
}) {
  const schema = getBlockSchema(block.type);
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button type="button" className="flex-1 truncate text-left text-[0.7rem] font-medium text-fg" onClick={() => setOpen((value) => !value)}>
          {schema?.label ?? block.type}
          {!block.visible ? " · masqué" : ""}
        </button>
        <button type="button" className="h-7 w-7 text-[10px] text-faint" onClick={() => onMove(-1)} title="Monter">↑</button>
        <button type="button" className="h-7 w-7 text-[10px] text-faint" onClick={() => onMove(1)} title="Descendre">↓</button>
        <button type="button" className="h-7 w-7 text-[10px] text-faint" onClick={() => onChange({ ...block, visible: !block.visible })} title="Masquer">👁</button>
        <button type="button" className="h-7 w-7 text-[10px] text-red-400" onClick={onDelete} title="Supprimer">✕</button>
      </div>
      {open ? (
        <div className="grid gap-3 border-t border-border p-2.5">
          {schema?.fields.map((field) => (
            <FieldControl
              key={field.key}
              field={field}
              value={block.settings[field.key]}
              context={context}
              compact
              onChange={(value) =>
                onChange({ ...block, settings: { ...block.settings, [field.key]: value } })
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Paramètres du thème
 * ------------------------------------------------------------------ */

export type ThemeSettingsCategory =
  | "logo"
  | "favicon"
  | "colors"
  | "typography"
  | "layout"
  | "animations"
  | "visual"
  | "social"
  | "search"
  | "currency"
  | "cart"
  | "custom-css"
  | "style"
  | "translations";

export const THEME_CATEGORIES: { id: ThemeSettingsCategory; label: string; icon: string }[] = [
  { id: "logo", label: "Logo", icon: "🖼" },
  { id: "favicon", label: "Favicon", icon: "🔖" },
  { id: "colors", label: "Couleurs", icon: "🎨" },
  { id: "typography", label: "Typographie", icon: "🔤" },
  { id: "layout", label: "Mise en page", icon: "📐" },
  { id: "animations", label: "Animations", icon: "✨" },
  { id: "visual", label: "Éléments visuels", icon: "🃏" },
  { id: "social", label: "Réseaux sociaux", icon: "📱" },
  { id: "search", label: "Recherche", icon: "🔍" },
  { id: "currency", label: "Devise", icon: "💰" },
  { id: "cart", label: "Panier", icon: "🛒" },
  { id: "custom-css", label: "CSS personnalisé", icon: "💻" },
  { id: "style", label: "Style du thème", icon: "🎭" },
  { id: "translations", label: "Contenu du thème", icon: "📝" },
];

export function ThemeSettingsPanel({
  category,
  settings,
  context,
  onChange,
  onDeletePalette,
  onDuplicatePalette,
}: {
  category: ThemeSettingsCategory;
  settings: ThemeSettings;
  context: EditorFieldContext;
  onChange: (patch: Partial<ThemeSettings>) => void;
  onDeletePalette: (id: string) => void;
  onDuplicatePalette: (id: string) => void;
}) {
  const localField = (
    field: FieldSchema,
    key: keyof ThemeSettings,
  ) => (
    <FieldControl
      key={key as string}
      field={field}
      value={settings[key] as SettingValue}
      context={context}
      onChange={(value) => onChange({ [key]: value } as Partial<ThemeSettings>)}
    />
  );

  switch (category) {
    case "logo":
      return (
        <div className="grid gap-3">
          <FieldControl field={{ key: "logoUrl", label: "Logo", type: "image", tab: "content", defaultValue: "" }} value={settings.logoUrl} context={context} onChange={(value) => onChange({ logoUrl: String(value) })} />
          <FieldControl field={{ key: "logoAlt", label: "Texte alternatif", type: "text", tab: "content", defaultValue: "" }} value={settings.logoAlt} context={context} onChange={(value) => onChange({ logoAlt: String(value) })} />
          <FieldControl field={{ key: "logoWidth", label: "Largeur (px)", type: "range", tab: "content", min: 16, max: 120, defaultValue: 40 }} value={settings.logoWidth} context={context} onChange={(value) => onChange({ logoWidth: Number(value) })} />
          <FieldControl field={{ key: "mobileLogoUrl", label: "Logo mobile", type: "image", tab: "content", defaultValue: "" }} value={settings.mobileLogoUrl} context={context} onChange={(value) => onChange({ mobileLogoUrl: String(value) })} />
          <FieldControl field={{ key: "logoPosition", label: "Position", type: "select", tab: "content", defaultValue: "left", options: [{ value: "left", label: "Gauche" }, { value: "center", label: "Centre" }] }} value={settings.logoPosition} context={context} onChange={(value) => onChange({ logoPosition: value as ThemeSettings["logoPosition"] })} />
        </div>
      );

    case "favicon":
      return (
        <div className="grid gap-3">
          <FieldControl field={{ key: "faviconUrl", label: "Favicon (32×32 recommandé)", type: "image", tab: "content", defaultValue: "" }} value={settings.faviconUrl} context={context} onChange={(value) => onChange({ faviconUrl: String(value) })} />
          <p className="text-[0.7rem] leading-relaxed text-subtle">Le favicon apparaît dans l’onglet du navigateur. Utilise une image carrée, lisible en petit.</p>
        </div>
      );

    case "colors":
      return (
        <div className="grid gap-4">
          <div className="grid gap-2">
            {settings.palettes.map((palette) => (
              <div key={palette.id} className={cn("rounded-xl border p-3", settings.activePaletteId === palette.id ? "border-brand-500 bg-brand-500/5" : "border-border")}>
                <div className="flex items-center gap-2">
                  <input
                    className="min-w-0 flex-1 bg-transparent text-[0.8rem] font-semibold text-fg outline-none"
                    value={palette.name}
                    onChange={(event) =>
                      onChange({
                        palettes: settings.palettes.map((entry) =>
                          entry.id === palette.id ? { ...entry, name: event.target.value } : entry,
                        ),
                      })
                    }
                  />
                  <button type="button" className="text-[10px] text-brand-400" onClick={() => onChange({ activePaletteId: palette.id })}>
                    {settings.activePaletteId === palette.id ? "Active" : "Utiliser"}
                  </button>
                  <button type="button" className="text-[10px] text-subtle" onClick={() => onDuplicatePalette(palette.id)}>⧉</button>
                  {settings.palettes.length > 1 ? (
                    <button type="button" className="text-[10px] text-red-400" onClick={() => onDeletePalette(palette.id)}>✕</button>
                  ) : null}
                </div>
                <PaletteEditor
                  palette={palette}
                  onChange={(next) =>
                    onChange({
                      palettes: settings.palettes.map((entry) => (entry.id === palette.id ? next : entry)),
                    })
                  }
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            className="h-10 rounded-xl border border-dashed border-border text-[0.72rem] font-medium text-subtle hover:border-brand-500 hover:text-fg"
            onClick={() => {
              const palette = {
                ...settings.palettes[0],
                id: `palette-${Date.now().toString(36)}`,
                name: `Palette ${settings.palettes.length + 1}`,
              };
              onChange({ palettes: [...settings.palettes, palette] });
            }}
          >
            + Ajouter une palette
          </button>
        </div>
      );

    case "typography":
      return (
        <div className="grid gap-3">
          {localField({ key: "headingFont", label: "Police des titres", type: "select", tab: "typography", defaultValue: "sans", options: FONT_OPTIONS }, "headingFont")}
          {localField({ key: "bodyFont", label: "Police du corps", type: "select", tab: "typography", defaultValue: "sans", options: FONT_OPTIONS }, "bodyFont")}
          {localField({ key: "typeScale", label: "Échelle typographique", type: "range", tab: "typography", min: 0.8, max: 1.6, step: 0.05, defaultValue: 1.15 }, "typeScale")}
          {localField({ key: "baseFontSize", label: "Taille de base", type: "range", tab: "typography", min: 13, max: 20, defaultValue: 16, unit: "px" }, "baseFontSize")}
          {localField({ key: "headingWeight", label: "Graisse des titres", type: "select", tab: "typography", defaultValue: "600", options: [{ value: "400", label: "400 — Normal" }, { value: "500", label: "500" }, { value: "600", label: "600" }, { value: "700", label: "700" }, { value: "800", label: "800" }, { value: "900", label: "900" }] }, "headingWeight")}
          {localField({ key: "lineHeight", label: "Hauteur de ligne", type: "range", tab: "typography", min: 1, max: 2, step: 0.05, defaultValue: 1.55 }, "lineHeight")}
          {localField({ key: "letterSpacing", label: "Espacement des lettres", type: "range", tab: "typography", min: -1, max: 2, step: 0.1, defaultValue: 0, unit: "px" }, "letterSpacing")}
        </div>
      );

    case "layout":
      return (
        <div className="grid gap-3">
          {localField({ key: "pageWidth", label: "Largeur maximale", type: "select", tab: "layout", defaultValue: "1400", options: [{ value: "1200", label: "1200 px" }, { value: "1400", label: "1400 px" }, { value: "1600", label: "1600 px" }, { value: "full", label: "Pleine largeur" }] }, "pageWidth")}
          {localField({ key: "contentWidth", label: "Largeur du contenu", type: "select", tab: "layout", defaultValue: "normal", options: [{ value: "narrow", label: "Étroit" }, { value: "normal", label: "Normal" }, { value: "wide", label: "Large" }] }, "contentWidth")}
          {localField({ key: "sectionSpacing", label: "Espacement entre sections", type: "range", tab: "layout", min: 0, max: 120, defaultValue: 64, unit: "px" }, "sectionSpacing")}
          {localField({ key: "gridGapX", label: "Espacement horizontal des grilles", type: "range", tab: "layout", min: 0, max: 48, defaultValue: 20, unit: "px" }, "gridGapX")}
          {localField({ key: "gridGapY", label: "Espacement vertical des grilles", type: "range", tab: "layout", min: 0, max: 48, defaultValue: 28, unit: "px" }, "gridGapY")}
          {localField({ key: "pageMargin", label: "Marges générales", type: "range", tab: "layout", min: 0, max: 48, defaultValue: 20, unit: "px" }, "pageMargin")}
        </div>
      );

    case "animations":
      return (
        <div className="grid gap-3">
          {localField({ key: "revealOnScroll", label: "Révéler les sections au défilement", type: "toggle", tab: "animations", defaultValue: true }, "revealOnScroll")}
          {localField({ key: "revealAnimation", label: "Animation d’apparition", type: "select", tab: "animations", defaultValue: "fade", options: [{ value: "fade", label: "Fondu" }, { value: "slide", label: "Glissement" }, { value: "zoom", label: "Zoom" }] }, "revealAnimation")}
          {localField({ key: "cardHover", label: "Survol des cartes", type: "select", tab: "animations", defaultValue: "elevate", options: [{ value: "elevate", label: "Élévation" }, { value: "tilt", label: "3D" }, { value: "none", label: "Aucun" }] }, "cardHover")}
          {localField({ key: "hoverLift", label: "Élévation verticale", type: "range", tab: "animations", min: 0, max: 16, defaultValue: 4, unit: "px" }, "hoverLift")}
          {localField({ key: "hoverPerspective", label: "Profondeur 3D", type: "range", tab: "animations", min: 100, max: 2000, step: 50, defaultValue: 600, unit: "px" }, "hoverPerspective")}
          {localField({ key: "buttonHover", label: "Effet des boutons", type: "select", tab: "animations", defaultValue: "scale", options: [{ value: "scale", label: "Agrandir" }, { value: "shadow", label: "Ombre" }, { value: "none", label: "Aucun" }] }, "buttonHover")}
        </div>
      );

    case "visual":
      return (
        <div className="grid gap-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-faint">Cartes de produits</p>
          <FieldControl
            field={{ key: "productCardRadius", label: "Coins arrondis", type: "range", tab: "visual", min: 0, max: 40, defaultValue: 16, unit: "px" }}
            value={settings.productCard.radius}
            context={context}
            onChange={(value) => onChange({ productCard: { ...settings.productCard, radius: Number(value) } })}
          />
          <div className="grid gap-2">
            {[
              ["border", "Bordure", settings.productCard.border],
              ["shadow", "Ombre", settings.productCard.shadow],
              ["showPrice", "Afficher le prix", settings.productCard.showPrice],
              ["showVendor", "Afficher le fournisseur", settings.productCard.showVendor],
              ["showBadge", "Afficher le badge", settings.productCard.showBadge],
            ].map(([key, label, checked]) => (
              <label key={key as string} className="flex items-center justify-between rounded-xl border border-border bg-bg-soft px-3 py-2 text-[0.72rem]">
                <span>{label as string}</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-500"
                  checked={checked as boolean}
                  onChange={(event) =>
                    onChange({
                      productCard: { ...settings.productCard, [key as string]: event.target.checked },
                    })
                  }
                />
              </label>
            ))}
          </div>
          {localField({ key: "collectionCardRadius", label: "Cartes de collections — coins", type: "range", tab: "visual", min: 0, max: 40, defaultValue: 16, unit: "px" }, "collectionCardRadius")}
          {localField({ key: "collectionCardShowCount", label: "Afficher le nombre de produits", type: "toggle", tab: "visual", defaultValue: true }, "collectionCardShowCount")}
          {localField({ key: "articleCardRadius", label: "Cartes d’articles — coins", type: "range", tab: "visual", min: 0, max: 40, defaultValue: 16, unit: "px" }, "articleCardRadius")}
          {localField({ key: "mediaRadius", label: "Médias — coins", type: "range", tab: "visual", min: 0, max: 48, defaultValue: 20, unit: "px" }, "mediaRadius")}
          {localField({ key: "mediaBorder", label: "Médias — bordure", type: "toggle", tab: "visual", defaultValue: true }, "mediaBorder")}
          {localField({ key: "mediaShadow", label: "Médias — ombre", type: "toggle", tab: "visual", defaultValue: false }, "mediaShadow")}
        </div>
      );

    case "social":
      return (
        <div className="grid gap-3">
          {([
            ["socialInstagram", "Instagram"],
            ["socialFacebook", "Facebook"],
            ["socialTiktok", "TikTok"],
            ["socialYoutube", "YouTube"],
            ["socialPinterest", "Pinterest"],
            ["socialX", "X / Twitter"],
            ["socialLinkedin", "LinkedIn"],
            ["socialWhatsapp", "WhatsApp"],
          ] as const).map(([key, label]) =>
            localField({ key, label, type: "url", tab: "social", defaultValue: "", placeholder: "https://…" }, key),
          )}
        </div>
      );

    case "search":
      return (
        <div className="grid gap-3">
          {localField({ key: "searchSuggestions", label: "Suggestions de recherche", type: "toggle", tab: "search", defaultValue: true }, "searchSuggestions")}
          {localField({ key: "searchShowVendor", label: "Afficher le fournisseur", type: "toggle", tab: "search", defaultValue: false }, "searchShowVendor")}
          {localField({ key: "searchShowPrice", label: "Afficher le prix", type: "toggle", tab: "search", defaultValue: true }, "searchShowPrice")}
          {localField({ key: "searchSuggestionCount", label: "Nombre de suggestions", type: "range", tab: "search", min: 3, max: 10, defaultValue: 5 }, "searchSuggestionCount")}
        </div>
      );

    case "currency":
      return (
        <div className="grid gap-3">
          {localField({ key: "currencyShowCode", label: "Afficher le code devise", type: "toggle", tab: "currency", defaultValue: false }, "currencyShowCode")}
          {localField({ key: "currencySymbolPosition", label: "Position du symbole", type: "select", tab: "currency", defaultValue: "after", options: [{ value: "before", label: "Avant" }, { value: "after", label: "Après" }] }, "currencySymbolPosition")}
          {localField({ key: "currencyThousands", label: "Séparateur de milliers", type: "select", tab: "currency", defaultValue: "space", options: [{ value: "space", label: "Espace" }, { value: "comma", label: "Virgule" }, { value: "dot", label: "Point" }] }, "currencyThousands")}
        </div>
      );

    case "cart":
      return (
        <div className="grid gap-3">
          {localField({ key: "cartType", label: "Type de panier", type: "select", tab: "cart", defaultValue: "drawer", options: [{ value: "drawer", label: "Tiroir" }, { value: "page", label: "Page" }, { value: "popup", label: "Pop-up" }] }, "cartType")}
          {localField({ key: "cartShowVendor", label: "Afficher le fournisseur", type: "toggle", tab: "cart", defaultValue: false }, "cartShowVendor")}
          {localField({ key: "cartNote", label: "Note de commande", type: "toggle", tab: "cart", defaultValue: true }, "cartNote")}
          {localField({ key: "cartEmptyCollectionId", label: "Collection quand le panier est vide", type: "text", tab: "cart", defaultValue: "", optional: true, help: "Les produits de cette collection sont proposés lorsque le panier est vide." }, "cartEmptyCollectionId")}
          {localField({ key: "cartBgColor", label: "Fond du tiroir", type: "color", tab: "cart", defaultValue: "" }, "cartBgColor")}
          {localField({ key: "cartTextColor", label: "Texte du tiroir", type: "color", tab: "cart", defaultValue: "" }, "cartTextColor")}
          {localField({ key: "cartButtonColor", label: "Bouton du tiroir", type: "color", tab: "cart", defaultValue: "" }, "cartButtonColor")}
        </div>
      );

    case "custom-css":
      return (
        <div className="grid gap-3">
          <FieldControl
            field={{ key: "customCss", label: "CSS personnalisé", type: "css", tab: "content", optional: true, defaultValue: "" }}
            value={settings.customCss}
            context={context}
            onChange={(value) => onChange({ customCss: String(value) })}
          />
          <p className="text-[0.7rem] leading-relaxed text-subtle">
            Ce code est injecté dans la vitrine. Exemple : <code>{".titre { color: red; }"}</code>. Le CSS personnalisé est un bonus : tout doit rester faisable sans code.
          </p>
        </div>
      );

    case "style":
      return (
        <div className="grid gap-2">
          {Object.entries(STYLE_PRESETS).map(([id, preset]) => (
            <button
              key={id}
              type="button"
              className={cn("rounded-xl border p-3 text-left", settings.stylePreset === id ? "border-brand-500 bg-brand-500/10" : "border-border bg-bg-soft hover:border-border-strong")}
              onClick={() => {
                if (!window.confirm(`Appliquer le style « ${preset.label} » ? Les réglages de couleurs et de typographie seront remplacés.`)) return;
                onChange({ ...preset.settings, stylePreset: id as ThemeSettings["stylePreset"] });
              }}
            >
              <span className="block text-[0.8rem] font-semibold text-fg">{preset.label}</span>
              <span className="mt-0.5 block text-[0.68rem] leading-relaxed text-subtle">{preset.description}</span>
            </button>
          ))}
        </div>
      );

    case "translations": {
      const defaults: Record<string, string> = {
        navHome: "Accueil",
        navProducts: "Produits",
        navCollections: "Collections",
        navAbout: "À propos",
        navContact: "Contact",
        addToCart: "Ajouter au panier",
        viewCart: "Voir le panier",
        searchTitle: "Rechercher",
        newsletterPlaceholder: "ton@email.com",
        newsletterButton: "S’inscrire",
        freeShipping: "Livraison offerte",
        footerRights: "Tous droits réservés",
        emptyCart: "Ton panier est vide",
      };

      return (
        <div className="grid gap-2">
          <p className="text-[0.7rem] leading-relaxed text-subtle">Modifie les libellés par défaut du thème. Laisse vide pour garder la traduction automatique.</p>
          {Object.entries(defaults).map(([key, fallback]) => (
            <div key={key} className="grid gap-1">
              <label className={labelClass()}>{fallback}</label>
              <input
                className={inputClass()}
                value={settings.translations[key] ?? ""}
                placeholder={fallback}
                onChange={(event) =>
                  onChange({
                    translations: { ...settings.translations, [key]: event.target.value },
                  })
                }
              />
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}

const FONT_OPTIONS = [
  { value: "sans", label: "Sans empattement (Geist)" },
  { value: "inter", label: "Inter" },
  { value: "serif", label: "Playfair Display" },
  { value: "georgia", label: "Georgia" },
  { value: "mono", label: "Monospace" },
  { value: "system", label: "Police du système" },
];

function PaletteEditor({
  palette,
  onChange,
}: {
  palette: ThemePalette;
  onChange: (palette: ThemePalette) => void;
}) {
  const roles: { key: keyof ThemePalette; label: string }[] = [
    { key: "background", label: "Arrière-plan" },
    { key: "text", label: "Texte principal" },
    { key: "muted", label: "Texte secondaire" },
    { key: "accent", label: "Accent" },
    { key: "buttonBg", label: "Bouton — fond" },
    { key: "buttonText", label: "Bouton — texte" },
    { key: "border", label: "Bordures" },
    { key: "badgePromo", label: "Badge promo" },
    { key: "badgeSoldOut", label: "Badge épuisé" },
    { key: "badgeNew", label: "Badge nouveau" },
  ];

  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5">
      {roles.map((role) => (
        <label key={role.key as string} className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1">
          <input
            type="color"
            className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
            value={palette[role.key] as string}
            onChange={(event) => onChange({ ...palette, [role.key]: event.target.value })}
          />
          <span className="truncate text-[0.6rem] text-subtle">{role.label}</span>
        </label>
      ))}
    </div>
  );
}
