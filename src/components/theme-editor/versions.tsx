"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { ThemeVersion } from "@/lib/theme-editor/types";

export function VersionHistory({
  themeId,
  themeName,
  versions,
  locale,
}: {
  themeId: string;
  themeName: string;
  versions: ThemeVersion[];
  locale: Locale;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const restore = async (versionId: string) => {
    if (!window.confirm("Restaurer cette version dans le brouillon ? La version actuelle reste dans l’historique.")) return;
    setBusy(versionId);
    const response = await fetch(`/api/themes/${themeId}/versions/${versionId}/restore`, {
      method: "POST",
    });
    setBusy(null);
    if (!response.ok) {
      setMessage("Impossible de restaurer cette version.");
      return;
    }
    router.push(`/${locale}/app/themes/${themeId}/editor`);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/${locale}/app/themes/${themeId}/editor`} className="text-[0.72rem] font-medium text-subtle hover:text-fg">‹ Retour à l’éditeur</Link>
          <h1 className="mt-2 text-xl font-semibold text-fg">Historique · {themeName}</h1>
          <p className="mt-1 text-[0.78rem] text-subtle">Les 50 dernières versions enregistrées. Restaurer remplace le brouillon, jamais la version en ligne.</p>
        </div>
      </div>

      {message ? <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[0.75rem] text-red-300">{message}</p> : null}

      <div className="mt-5 grid gap-2">
        {versions.map((version) => (
          <div key={version.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
            <div>
              <p className="text-[0.8rem] font-semibold text-fg">Version {version.versionNumber}</p>
              <p className="mt-0.5 text-[0.68rem] text-subtle">
                {new Date(version.createdAt).toLocaleString("fr-FR")} · {version.authorName ?? "Membre"}
              </p>
            </div>
            <button
              type="button"
              disabled={busy === version.id}
              className="h-9 rounded-full border border-border px-3 text-[0.7rem] font-medium text-fg hover:border-brand-500 disabled:opacity-50"
              onClick={() => restore(version.id)}
            >
              {busy === version.id ? "Restauration…" : "Restaurer"}
            </button>
          </div>
        ))}
        {versions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-[0.78rem] text-subtle">
            Aucune version pour l’instant. Enregistre le thème avec Ctrl+S pour créer la première.
          </p>
        ) : null}
      </div>
    </div>
  );
}
