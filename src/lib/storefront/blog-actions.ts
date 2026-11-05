"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageCatalog, currentMembership } from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { toFieldErrors } from "@/lib/validation";
import { blogPostSchema } from "@/lib/storefront/blog";

export type BlogFormState = {
  status: "idle" | "error" | "invalid";
  fieldErrors?: Record<string, string>;
  messageKey?: string;
};

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function saveBlogPostAction(
  _previous: BlogFormState,
  formData: FormData,
): Promise<BlogFormState> {
  const locale = field(formData, "locale") || "fr";

  if (!isSupabaseConfigured()) return { status: "error", messageKey: "serverError" };

  const membership = await currentMembership();
  if (!membership || !canManageCatalog(membership.role)) {
    return { status: "error", messageKey: "accessDenied" };
  }

  const parsed = blogPostSchema.safeParse({
    id: field(formData, "id") || undefined,
    slug: field(formData, "slug"),
    title: field(formData, "title"),
    excerpt: field(formData, "excerpt"),
    body: field(formData, "body"),
    coverKey: field(formData, "coverKey"),
    status: field(formData, "status") || "draft",
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const published = parsed.data.status === "published";
  const payload = {
    store_id: membership.store.id,
    slug: parsed.data.slug,
    title: parsed.data.title,
    excerpt: parsed.data.excerpt || null,
    body: parsed.data.body,
    cover_key: parsed.data.coverKey || null,
    status: parsed.data.status,
    published_at: published ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = parsed.data.id
    ? await supabase
        .from("store_blog_posts")
        .update(payload)
        .eq("id", parsed.data.id)
        .eq("store_id", membership.store.id)
    : await supabase.from("store_blog_posts").insert(payload);

  if (error) {
    return {
      status: "error",
      messageKey: error.code === "23505" ? "blogSlugTaken" : "serverError",
    };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/online-store/blog?saved=1`);
}

export async function deleteBlogPostAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  const id = field(formData, "id");

  if (!isSupabaseConfigured() || !id) return;

  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/auth/login`);

  const supabase = await createClient();
  await supabase
    .from("store_blog_posts")
    .delete()
    .eq("id", id)
    .eq("store_id", membership.store.id);

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/online-store/blog?deleted=1`);
}
