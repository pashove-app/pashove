import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { createThemeDocument } from "@/lib/theme-editor/defaults";
import { normalizeDocument } from "@/lib/theme-editor/normalize";
import { paymentMethodLabels } from "@/lib/theme-editor/render-context";
import { getCheckoutPaymentMethods } from "@/lib/payments/queries";
import type {
  ThemeAssignment,
  ThemeDocument,
  ThemeEditorData,
  ThemeSummary,
  ThemeVersion,
} from "@/lib/theme-editor/types";

type RawTheme = {
  id: string;
  name: string;
  status: "draft" | "published";
  isActive: boolean;
  draft: unknown;
  updatedAt?: string | null;
  publishedAt?: string | null;
};

type RawEditorData = {
  themes?: RawTheme[];
  appEmbeds?: ThemeEditorData["appEmbeds"];
  appBlocks?: ThemeEditorData["appBlocks"];
  assignments?: ThemeAssignment[];
};

function toSummary(raw: RawTheme): ThemeSummary {
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status === "published" ? "published" : "draft",
    isActive: raw.isActive === true,
    draft: normalizeDocument(raw.draft) ?? createThemeDocument("dawn"),
    updatedAt: raw.updatedAt ?? null,
    publishedAt: raw.publishedAt ?? null,
  };
}

/** Charge tout ce dont l'éditeur a besoin, et crée un thème au premier passage. */
export async function loadEditorData(storeId: string): Promise<ThemeEditorData> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("theme_editor_load", { p_store_id: storeId });
  const raw = (data ?? {}) as RawEditorData;

  const themes = (raw.themes ?? []).map(toSummary);

  if (themes.length === 0) {
    const { data: created } = await supabase.rpc("theme_create", {
      p_store_id: storeId,
      p_name: "Pashove Dawn",
      p_document: createThemeDocument("dawn"),
    });

    if (created && typeof created === "object") {
      const row = created as RawTheme;
      themes.push(toSummary({ ...row, status: "draft", isActive: false }));
    }
  }

  return {
    themes,
    appEmbeds: Array.isArray(raw.appEmbeds) ? raw.appEmbeds : [],
    appBlocks: Array.isArray(raw.appBlocks) ? raw.appBlocks : [],
    assignments: Array.isArray(raw.assignments) ? raw.assignments : [],
  };
}

export async function getTheme(storeId: string, themeId: string): Promise<ThemeSummary | null> {
  const data = await loadEditorData(storeId);
  return data.themes.find((theme) => theme.id === themeId) ?? null;
}

export async function getThemeVersions(
  storeId: string,
  themeId: string,
): Promise<ThemeVersion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("theme_versions")
    .select("id, version_number, snapshot, created_at, created_by")
    .eq("theme_id", themeId)
    .order("version_number", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as unknown as {
    id: string;
    version_number: number;
    snapshot: unknown;
    created_at: string;
    created_by: string | null;
  }[];

  const userIds = [...new Set(rows.map((row) => row.created_by).filter(Boolean))] as string[];
  let names = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    names = new Map(
      ((profiles ?? []) as { id: string; full_name: string | null }[]).map((profile) => [
        profile.id,
        profile.full_name?.trim() || "Membre",
      ]),
    );
  }

  return rows.map((row) => ({
    id: row.id,
    versionNumber: row.version_number,
    createdAt: row.created_at,
    createdBy: row.created_by,
    authorName: row.created_by ? names.get(row.created_by) ?? null : null,
    snapshot: normalizeDocument(row.snapshot) ?? createThemeDocument("dawn"),
  }));
}

export type PublicThemeDocument = {
  themeId: string;
  document: ThemeDocument;
  appEmbeds: { appId: string; name: string; settings: Record<string, unknown> }[];
};

/** Document publié d'une boutique, ou `null` si le thème historique est actif. */
export const getPublicThemeDocument = cache(
  async (slug: string): Promise<PublicThemeDocument | null> => {
    const supabase = createPublicClient();
    const { data } = await supabase.rpc("public_store_theme_document", { p_slug: slug });
    if (!data || typeof data !== "object") return null;

    const raw = data as {
      themeId?: unknown;
      document?: unknown;
      appEmbeds?: unknown;
    };
    const document = normalizeDocument(raw.document);
    if (!document || typeof raw.themeId !== "string") return null;

    return {
      themeId: raw.themeId,
      document,
      appEmbeds: Array.isArray(raw.appEmbeds)
        ? (raw.appEmbeds as PublicThemeDocument["appEmbeds"])
        : [],
    };
  },
);

/**
 * Moyens de paiement affichés sur la vitrine. La liste vient de l'éligibilité
 * calculée en base (plan, pays, devise, COD) : aucun moyen non configuré.
 */
export async function getPublicPaymentMethods(store: {
  slug: string;
  country: string;
  currency: string;
  cod_enabled: boolean;
}): Promise<string[]> {
  try {
    const eligibility = await getCheckoutPaymentMethods(
      store.slug,
      false,
      store.country,
      store.currency,
      0,
      true,
    );
    return paymentMethodLabels(eligibility.methods);
  } catch {
    return [];
  }
}

export async function getPublicAssignment(
  slug: string,
  resourceType: string,
  resourceId: string,
): Promise<string | null> {
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("public_theme_assignment", {
    p_slug: slug,
    p_resource_type: resourceType,
    p_resource_id: resourceId,
  });
  return typeof data === "string" ? data : null;
}

export async function getPublicMetafields(
  slug: string,
  ownerType: string,
  ownerId: string,
): Promise<Record<string, unknown>> {
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("public_metafields", {
    p_slug: slug,
    p_owner_type: ownerType,
    p_owner_id: ownerId,
  });
  return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
}

export async function getPreviewDocument(
  token: string,
): Promise<PublicThemeDocument | null> {
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("public_theme_preview", { p_token: token });
  if (!data || typeof data !== "object") return null;
  const raw = data as { themeId?: unknown; document?: unknown; appEmbeds?: unknown };
  const document = normalizeDocument(raw.document);
  if (!document || typeof raw.themeId !== "string") return null;
  return {
    themeId: raw.themeId,
    document,
    appEmbeds: Array.isArray(raw.appEmbeds)
      ? (raw.appEmbeds as PublicThemeDocument["appEmbeds"])
      : [],
  };
}
