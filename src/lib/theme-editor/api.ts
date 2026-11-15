import { NextResponse } from "next/server";
import { currentMembership } from "@/lib/stores/queries";
import { loadEditorData } from "@/lib/theme-editor/queries";
import { saveThemeDraft, type MutationResult } from "@/lib/theme-editor/mutations";
import type { ThemeDocument, ThemeSummary } from "@/lib/theme-editor/types";

export type EditorContext = {
  storeId: string;
  storeSlug: string;
  locale: string;
};

export async function editorContext(): Promise<EditorContext | null> {
  const membership = await currentMembership();
  if (!membership) return null;
  return {
    storeId: membership.store.id,
    storeSlug: membership.store.slug,
    locale: "fr",
  };
}

export function jsonError(
  result: MutationResult<unknown>,
): NextResponse {
  if (result.ok) {
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
  const status =
    result.error === "unauthorized"
      ? 403
      : result.error === "not_found"
        ? 404
        : result.error === "invalid"
          ? 422
          : 500;
  return NextResponse.json({ error: result.error, message: result.message }, { status });
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function loadThemeDocument(
  storeId: string,
  themeId: string,
): Promise<ThemeSummary | null> {
  const data = await loadEditorData(storeId);
  return data.themes.find((theme) => theme.id === themeId) ?? null;
}

/** Applique une modification au document puis l'enregistre sans créer de version. */
export async function mutateThemeDocument(
  storeId: string,
  themeId: string,
  mutate: (document: ThemeDocument) => ThemeDocument | null,
): Promise<MutationResult<ThemeDocument>> {
  const theme = await loadThemeDocument(storeId, themeId);
  if (!theme) {
    return { ok: false, error: "not_found", message: "Thème introuvable." };
  }

  const next = mutate(theme.draft);
  if (!next) {
    return { ok: false, error: "invalid", message: "Modification impossible." };
  }

  return saveThemeDraft(storeId, themeId, next, false);
}
