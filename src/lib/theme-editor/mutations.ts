import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createThemeDocument, type ThemePresetId } from "@/lib/theme-editor/defaults";
import { normalizeDocument } from "@/lib/theme-editor/normalize";
import type { ThemeDocument, ThemeSummary } from "@/lib/theme-editor/types";

export type MutationResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: "invalid" | "unauthorized" | "not_found" | "failed"; message?: string };

function errorCode(error: { message?: string } | null): MutationResult<never> {
  const message = error?.message ?? "";
  if (message.includes("theme_unavailable")) {
    return { ok: false, error: "unauthorized", message: "Boutique non autorisée." };
  }
  if (message.includes("theme_not_found") || message.includes("theme_version_not_found")) {
    return { ok: false, error: "not_found", message: "Thème introuvable." };
  }
  if (message.includes("theme_invalid")) {
    return { ok: false, error: "invalid", message: "Document de thème invalide." };
  }
  if (message.includes("theme_limit")) {
    return { ok: false, error: "invalid", message: "Limite de 20 thèmes atteinte." };
  }
  return { ok: false, error: "failed", message: message || "Opération impossible." };
}

export async function saveThemeDraft(
  storeId: string,
  themeId: string,
  document: ThemeDocument,
  makeVersion = true,
): Promise<MutationResult<ThemeDocument>> {
  const normalized = normalizeDocument(document);
  if (!normalized) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("theme_save_draft", {
    p_store_id: storeId,
    p_theme_id: themeId,
    p_document: normalized,
    p_make_version: makeVersion,
  });

  if (error || !data) return errorCode(error);
  return { ok: true, data: normalized };
}

export async function publishTheme(
  storeId: string,
  themeId: string,
): Promise<MutationResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("theme_publish", {
    p_store_id: storeId,
    p_theme_id: themeId,
  });

  if (error) return errorCode(error);
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

export async function createTheme(
  storeId: string,
  name: string,
  presetId: ThemePresetId,
): Promise<MutationResult<ThemeSummary>> {
  const document = createThemeDocument(presetId);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("theme_create", {
    p_store_id: storeId,
    p_name: name,
    p_document: document,
  });

  if (error || !data) return errorCode(error);
  const row = data as { id: string; name: string };
  return {
    ok: true,
    data: {
      id: row.id,
      name: row.name,
      status: "draft",
      isActive: false,
      draft: document,
    },
  };
}

export async function duplicateTheme(
  storeId: string,
  themeId: string,
): Promise<MutationResult<ThemeSummary>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("theme_duplicate", {
    p_store_id: storeId,
    p_theme_id: themeId,
  });

  if (error || !data) return errorCode(error);
  const row = data as { id: string; name: string; draft: unknown };
  const document = normalizeDocument(row.draft) ?? createThemeDocument("dawn");
  return {
    ok: true,
    data: {
      id: row.id,
      name: row.name,
      status: "draft",
      isActive: false,
      draft: document,
    },
  };
}

export async function deleteTheme(
  storeId: string,
  themeId: string,
): Promise<MutationResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("theme_delete", {
    p_store_id: storeId,
    p_theme_id: themeId,
  });

  if (error) return errorCode(error);
  if (data !== true) {
    return { ok: false, error: "invalid", message: "Le thème en ligne ne peut pas être supprimé." };
  }
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

export async function renameTheme(
  storeId: string,
  themeId: string,
  name: string,
): Promise<MutationResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("theme_rename", {
    p_store_id: storeId,
    p_theme_id: themeId,
    p_name: name,
  });
  if (error) return errorCode(error);
  return { ok: true, data: undefined };
}

export async function restoreThemeVersion(
  storeId: string,
  themeId: string,
  versionId: string,
): Promise<MutationResult<ThemeDocument>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("theme_restore_version", {
    p_store_id: storeId,
    p_theme_id: themeId,
    p_version_id: versionId,
  });
  if (error || !data) return errorCode(error);
  const document = normalizeDocument(data);
  if (!document) return { ok: false, error: "invalid" };
  return { ok: true, data: document };
}

export async function createPreviewLink(
  storeId: string,
  themeId: string,
): Promise<MutationResult<{ token: string }>> {
  // Jeton opaque, non devinable : il ouvre un brouillon privé pendant 7 jours.
  const token = randomBytes(24).toString("base64url");

  const supabase = await createClient();
  const { error } = await supabase.rpc("theme_create_preview", {
    p_store_id: storeId,
    p_theme_id: themeId,
    p_token: token,
  });
  if (error) return errorCode(error);
  return { ok: true, data: { token } };
}

export async function assignTemplate(
  storeId: string,
  themeId: string,
  templateKey: string,
  resourceType: "product" | "collection" | "page" | "article",
  resourceId: string,
): Promise<MutationResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("theme_assign_template", {
    p_store_id: storeId,
    p_theme_id: themeId,
    p_template_key: templateKey,
    p_resource_type: resourceType,
    p_resource_id: resourceId,
  });
  if (error) return errorCode(error);
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

export async function unassignTemplate(
  storeId: string,
  themeId: string,
  resourceType: "product" | "collection" | "page" | "article",
  resourceId: string,
): Promise<MutationResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("theme_unassign_template", {
    p_store_id: storeId,
    p_theme_id: themeId,
    p_resource_type: resourceType,
    p_resource_id: resourceId,
  });
  if (error) return errorCode(error);
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

export async function toggleAppEmbed(
  storeId: string,
  appId: string,
  name: string,
  enabled: boolean,
): Promise<MutationResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("app_embeds").upsert(
    {
      store_id: storeId,
      app_id: appId,
      name,
      enabled,
    },
    { onConflict: "store_id,app_id" },
  );
  if (error) return { ok: false, error: "failed" };
  return { ok: true, data: undefined };
}

export async function createAppBlock(
  storeId: string,
  appId: string,
  name: string,
  blockType: string,
): Promise<MutationResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("app_blocks").insert({
    store_id: storeId,
    app_id: appId,
    name,
    block_type: blockType,
  });
  if (error) return { ok: false, error: "failed" };
  return { ok: true, data: undefined };
}
