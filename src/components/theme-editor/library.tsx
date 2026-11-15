"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { THEME_LIBRARY, type ThemePresetId } from "@/lib/theme-editor/defaults";
import type { ThemeSummary } from "@/lib/theme-editor/types";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";

export function ThemeLibrary({
  themes,
  locale,
  storeName,
}: {
  themes: ThemeSummary[];
  locale: Locale;
  storeName: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState(`${storeName} · Pashove Dawn`);
  const [preset, setPreset] = useState<ThemePresetId>("dawn");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/themes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, preset }),
      });
      if (!response.ok) throw new Error("create_failed");
      const payload = (await response.json()) as { data?: { id?: string } };
      if (!payload.data?.id) throw new Error("create_failed");
      router.push(`/${locale}/app/themes/${payload.data.id}/editor`);
    } catch {
      setError("Impossible de créer le thème.");
      setBusy(false);
    }
  };

  const duplicate = async (id: string) => {
    const response = await fetch(`/api/themes/${id}/duplicate`, { method: "POST" });
    if (response.ok) router.refresh();
    else setError("Impossible de dupliquer ce thème.");
  };

  const remove = async (id: string) => {
    if (!window.confirm("Supprimer ce thème brouillon ?")) return;
    const response = await fetch(`/api/themes/${id}`, { method: "DELETE" });
    if (response.ok) router.refresh();
    else setError("Le thème en ligne ne peut pas être supprimé.");
  };

  const publish = async (id: string) => {
    if (!window.confirm("Publier ce thème sur la boutique ?")) return;
    const response = await fetch(`/api/themes/${id}/publish`, { method: "POST" });
    if (response.ok) router.refresh();
    else setError("Impossible de publier ce thème.");
  };

  return (
    <div className="grid gap-6">
      {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[0.75rem] text-red-300">{error}</p> : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-fg">Thèmes</h1>
          <p className="mt-1 text-[0.8rem] text-subtle">
            Construis ta boutique par sections, prévisualise sur mobile et publie quand tu es prêt.
          </p>
        </div>
        <button type="button" className="h-10 rounded-full bg-brand-500 px-5 text-[0.78rem] font-semibold text-white hover:bg-brand-600" onClick={() => setCreating((value) => !value)}>
          + Créer un thème
        </button>
      </div>

      {creating ? (
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-fg">Nouveau thème</h2>
          <label className="mt-3 grid gap-1">
            <span className="text-[0.68rem] font-semibold text-subtle">Nom</span>
            <input className="h-10 rounded-xl border border-border bg-bg-soft px-3 text-[0.8rem] text-fg" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <p className="mt-4 text-[0.68rem] font-semibold text-subtle">Bibliothèque de modèles</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {THEME_LIBRARY.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setPreset(entry.id)}
                className={cn("rounded-xl border p-3 text-left", preset === entry.id ? "border-brand-500 bg-brand-500/10" : "border-border bg-bg-soft hover:border-border-strong")}
              >
                <div className="flex gap-1">
                  {entry.swatches.map((swatch) => (
                    <span key={swatch} className="h-5 w-5 rounded-full border border-black/10" style={{ background: swatch }} />
                  ))}
                </div>
                <span className="mt-2 block text-[0.78rem] font-semibold text-fg">{entry.name}</span>
                <span className="mt-0.5 block text-[0.65rem] leading-relaxed text-subtle">{entry.description}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" disabled={busy} className="h-10 rounded-xl bg-brand-500 px-5 text-[0.78rem] font-semibold text-white disabled:opacity-50" onClick={create}>
              {busy ? "Création…" : "Créer et ouvrir l’éditeur"}
            </button>
            <button type="button" className="h-10 rounded-xl border border-border px-4 text-[0.78rem] text-subtle" onClick={() => setCreating(false)}>Annuler</button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {themes.map((theme) => (
          <article key={theme.id} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-[0.95rem] font-semibold text-fg">{theme.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-[0.6rem] font-semibold", theme.isActive ? "bg-emerald-500/15 text-emerald-400" : theme.status === "published" ? "bg-brand-500/15 text-brand-300" : "bg-amber-500/15 text-amber-300")}>
                    {theme.isActive ? "En ligne" : theme.status === "published" ? "Publié" : "Brouillon"}
                  </span>
                  {theme.updatedAt ? <span className="text-[0.62rem] text-faint">Modifié le {new Date(theme.updatedAt).toLocaleDateString("fr-FR")}</span> : null}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Link href={`/${locale}/app/themes/${theme.id}/editor`} className="rounded-full bg-fg px-3 py-1.5 text-[0.68rem] font-semibold text-bg">Personnaliser</Link>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Link href={`/${locale}/app/themes/${theme.id}/versions`} className="rounded-full border border-border px-2.5 py-1 text-[0.65rem] text-subtle hover:text-fg">Historique</Link>
              <button type="button" className="rounded-full border border-border px-2.5 py-1 text-[0.65rem] text-subtle hover:text-fg" onClick={() => duplicate(theme.id)}>Dupliquer</button>
              {theme.status === "draft" || !theme.isActive ? (
                <button type="button" className="rounded-full border border-brand-500/40 px-2.5 py-1 text-[0.65rem] font-semibold text-brand-300" onClick={() => publish(theme.id)}>Publier</button>
              ) : null}
              {!theme.isActive ? (
                <button type="button" className="rounded-full border border-red-500/30 px-2.5 py-1 text-[0.65rem] text-red-400" onClick={() => remove(theme.id)}>Supprimer</button>
              ) : null}
            </div>
          </article>
        ))}
        {themes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-[0.78rem] text-subtle md:col-span-2">
            Aucun thème pour l’instant. Crée le premier pour commencer.
          </div>
        ) : null}
      </div>
    </div>
  );
}
