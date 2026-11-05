"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageCatalog, currentMembership, currentStore } from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { toFieldErrors } from "@/lib/validation";
import { customPageSchema } from "@/lib/storefront/custom-pages";

export type CustomPageFormState = {
  status: "idle" | "error" | "invalid";
  fieldErrors?: Record<string, string>;
  messageKey?: string;
};

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function saveCustomPageAction(
  _previous: CustomPageFormState,
  formData: FormData,
): Promise<CustomPageFormState> {
  const locale = field(formData, "locale") || "fr";

  if (!isSupabaseConfigured()) return { status: "error", messageKey: "serverError" };

  const store = await currentStore();
  if (!store) return { status: "error", messageKey: "sessionExpired" };

  const membership = await currentMembership();
  if (!membership || !canManageCatalog(membership.role)) {
    return { status: "error", messageKey: "accessDenied" };
  }

  const parsed = customPageSchema.safeParse({
    id: field(formData, "id") || undefined,
    slug: field(formData, "slug"),
    title: field(formData, "title"),
    body: field(formData, "body"),
    status: field(formData, "status") || "draft",
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const payload = {
    store_id: store.id,
    slug: parsed.data.slug,
    title: parsed.data.title,
    body: parsed.data.body,
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  };

  const { error } = parsed.data.id
    ? await supabase
        .from("store_custom_pages")
        .update(payload)
        .eq("id", parsed.data.id)
        .eq("store_id", store.id)
    : await supabase.from("store_custom_pages").insert(payload);

  if (error) {
    return {
      status: "error",
      messageKey: error.code === "23505" ? "pageSlugTaken" : "serverError",
    };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/online-store/pages?saved=1`);
}

export async function deleteCustomPageAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  const id = field(formData, "id");

  if (!isSupabaseConfigured() || !id) return;

  const store = await currentStore();
  if (!store) redirect(`/${locale}/auth/login`);

  const supabase = await createClient();
  await supabase
    .from("store_custom_pages")
    .delete()
    .eq("id", id)
    .eq("store_id", store.id);

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/online-store/pages?deleted=1`);
}
