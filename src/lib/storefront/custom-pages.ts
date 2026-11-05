import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type CustomPageStatus = "draft" | "published";

export type CustomPage = {
  id: string;
  store_id: string;
  slug: string;
  title: string;
  body: string;
  status: CustomPageStatus;
  created_at: string;
  updated_at: string;
};

const COLUMNS = "id, store_id, slug, title, body, status, created_at, updated_at";

export async function listCustomPages(storeId: string): Promise<CustomPage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_custom_pages")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .order("updated_at", { ascending: false });

  return (data ?? []) as CustomPage[];
}

export async function getCustomPage(
  storeId: string,
  id: string,
): Promise<CustomPage | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_custom_pages")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .eq("id", id)
    .maybeSingle();

  return (data as CustomPage | null) ?? null;
}

export async function getPublishedCustomPage(
  storeId: string,
  slug: string,
): Promise<CustomPage | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_custom_pages")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return (data as CustomPage | null) ?? null;
}

export const customPageSchema = z.object({
  id: z.string().trim().optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/, "pageSlugInvalid"),
  title: z.string().trim().min(2, "pageTitleInvalid").max(120, "pageTitleInvalid"),
  body: z.string().trim().max(20000, "pageBodyTooLong"),
  status: z.enum(["draft", "published"]),
});
