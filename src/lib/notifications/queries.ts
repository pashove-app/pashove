import { createClient } from "@/lib/supabase/server";

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export async function listNotifications(limit = 20): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, href, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[notifications] list failed", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));
}

export async function countUnreadNotifications(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (error) {
    console.error("[notifications] count failed", error.message);
    return 0;
  }

  return count ?? 0;
}
