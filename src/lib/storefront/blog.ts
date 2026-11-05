import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type BlogPostStatus = "draft" | "published";

export type BlogPost = {
  id: string;
  store_id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_key: string | null;
  status: BlogPostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id, store_id, slug, title, excerpt, body, cover_key, status, published_at, created_at, updated_at";

export async function listPublishedPosts(storeId: string): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_blog_posts")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (data ?? []) as BlogPost[];
}

export async function listAllPosts(storeId: string): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_blog_posts")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .order("updated_at", { ascending: false });

  return (data ?? []) as BlogPost[];
}

export async function getPost(
  storeId: string,
  id: string,
): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_blog_posts")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .eq("id", id)
    .maybeSingle();

  return (data as BlogPost | null) ?? null;
}

export async function getPublishedPost(
  storeId: string,
  slug: string,
): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_blog_posts")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return (data as BlogPost | null) ?? null;
}

export const blogPostSchema = z.object({
  id: z.string().trim().optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/, "blogSlugInvalid"),
  title: z.string().trim().min(2, "blogTitleInvalid").max(140, "blogTitleInvalid"),
  excerpt: z.string().trim().max(300, "blogExcerptTooLong"),
  body: z.string().trim().max(30000, "blogBodyTooLong"),
  coverKey: z.string().trim().max(500, "blogCoverInvalid"),
  status: z.enum(["draft", "published"]),
});
