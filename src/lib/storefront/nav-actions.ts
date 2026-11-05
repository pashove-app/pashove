"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageTeam, currentMembership } from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { navSchema } from "@/lib/storefront/navigation";

export type NavFormState = {
  status: "idle" | "saved" | "error";
  messageKey?: string;
};

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Remplace la navigation de la boutique active par la liste fournie. */
export async function saveNavAction(
  _previous: NavFormState,
  formData: FormData,
): Promise<NavFormState> {
  const locale = field(formData, "locale") || "fr";

  if (!isSupabaseConfigured()) return { status: "error" };

  const membership = await currentMembership();
  if (!membership || !canManageTeam(membership.role)) {
    return { status: "error" };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(field(formData, "items") || "[]");
  } catch {
    return { status: "error" };
  }

  const parsed = navSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return { status: "error", messageKey: "navInvalid" };
  }

  const supabase = await createClient();
  const { error: deleteError } = await supabase
    .from("store_nav_items")
    .delete()
    .eq("store_id", membership.store.id);

  if (deleteError) return { status: "error" };

  if (parsed.data.length > 0) {
    const { error } = await supabase.from("store_nav_items").insert(
      parsed.data.map((item, index) => ({
        store_id: membership.store.id,
        label: item.label,
        href: item.href,
        position: index,
        visible: item.visible !== false,
      })),
    );

    if (error) return { status: "error" };
  }

  revalidatePath("/", "layout");
  revalidatePath(`/${locale}/app/online-store/navigation`);
  return { status: "saved" };
}

export async function resetNavAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  if (!isSupabaseConfigured()) return;

  const membership = await currentMembership();
  if (!membership || !canManageTeam(membership.role)) {
    redirect(`/${locale}/app/online-store/navigation`);
  }

  const supabase = await createClient();
  await supabase
    .from("store_nav_items")
    .delete()
    .eq("store_id", membership.store.id);

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/online-store/navigation?reset=1`);
}
