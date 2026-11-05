"use server";

import { revalidatePath } from "next/cache";
import { canManageTeam, currentMembership } from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { EMAIL_KINDS } from "@/lib/email/types";
import type { EmailKind } from "@/lib/email/types";

export type NotificationPreferencesState = {
  status: "idle" | "saved" | "error";
};

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Enregistre les catégories de notifications que le marchand accepte. */
export async function saveNotificationPreferencesAction(
  _previous: NotificationPreferencesState,
  formData: FormData,
): Promise<NotificationPreferencesState> {
  const locale = field(formData, "locale") || "fr";

  if (!isSupabaseConfigured()) return { status: "error" };

  const membership = await currentMembership();
  if (!membership) return { status: "error" };
  if (!canManageTeam(membership.role)) return { status: "error" };

  const supabase = await createClient();
  const now = new Date().toISOString();

  const rows = EMAIL_KINDS.map((kind: EmailKind) => ({
    store_id: membership.store.id,
    kind,
    enabled: formData.get(kind) === "on",
    updated_at: now,
  }));

  const { error } = await supabase
    .from("store_email_preferences")
    .upsert(rows, { onConflict: "store_id,kind" });

  if (error) {
    console.error("[email] preferences save failed", error.message);
    return { status: "error" };
  }

  revalidatePath(`/${locale}/app/settings/notifications`);
  return { status: "saved" };
}
