import { createClient } from "@/lib/supabase/server";

export type SupportStatus = "open" | "pending" | "resolved" | "closed";
export type SupportPriority = "low" | "normal" | "high" | "urgent";
export type SupportCategory =
  | "payments"
  | "orders"
  | "inventory"
  | "delivery"
  | "account"
  | "other";

export type SupportTicketSummary = {
  id: string;
  subject: string;
  status: SupportStatus;
  priority: SupportPriority;
  category: SupportCategory;
  sla_due_at: string;
  created_at: string;
  last_message_at: string;
  first_response_at: string | null;
  store_name: string | null;
  message_count: number;
};

type TicketRow = Omit<SupportTicketSummary, "store_name" | "message_count"> & {
  store: { name: string } | { name: string }[] | null;
  support_messages?: { count: number }[] | null;
};

function toSummary(row: TicketRow): SupportTicketSummary {
  const store = Array.isArray(row.store) ? row.store[0] : row.store;
  return {
    id: row.id,
    subject: row.subject,
    status: row.status,
    priority: row.priority,
    category: row.category,
    sla_due_at: row.sla_due_at,
    created_at: row.created_at,
    last_message_at: row.last_message_at,
    first_response_at: row.first_response_at,
    store_name: store?.name ?? null,
    message_count: row.support_messages?.[0]?.count ?? 0,
  };
}

export async function listSupportTickets(
  options: { storeId?: string; status?: string } = {},
): Promise<SupportTicketSummary[]> {
  const supabase = await createClient();

  const query = supabase
    .from("support_tickets")
    .select(
      "id, subject, status, priority, category, sla_due_at, created_at, last_message_at, first_response_at, store:stores(name), support_messages(count)",
    )
    .order("last_message_at", { ascending: false })
    .limit(100);

  const filtered = options.storeId
    ? query.eq("store_id", options.storeId)
    : query;

  const final =
    options.status && options.status !== "all"
      ? filtered.eq("status", options.status)
      : filtered;

  const { data } = await final;
  return ((data ?? []) as unknown as TicketRow[]).map(toSummary);
}

export type SupportMessage = {
  id: string;
  author_role: "merchant" | "admin" | "system";
  body: string;
  created_at: string;
};

export type SupportTicketDetail = SupportTicketSummary & {
  store_id: string;
  assigned_to: string | null;
  resolved_at: string | null;
  messages: SupportMessage[];
};

export async function getSupportTicket(
  id: string,
): Promise<SupportTicketDetail | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("support_tickets")
    .select(
      "id, store_id, subject, status, priority, category, sla_due_at, created_at, last_message_at, first_response_at, assigned_to, resolved_at, store:stores(name), support_messages(id, author_role, body, created_at)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  const row = data as unknown as TicketRow & {
    store_id: string;
    assigned_to: string | null;
    resolved_at: string | null;
    support_messages?: SupportMessage[] | { count: number }[];
  };

  const messages = Array.isArray(row.support_messages)
    ? (row.support_messages as SupportMessage[])
        .filter((message) => "body" in message)
        .sort(
          (left, right) =>
            new Date(left.created_at).getTime() -
            new Date(right.created_at).getTime(),
        )
    : [];

  return {
    ...toSummary({ ...row, support_messages: [{ count: messages.length }] }),
    store_id: row.store_id,
    assigned_to: row.assigned_to,
    resolved_at: row.resolved_at,
    messages,
  };
}

export type SupportArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  category: SupportCategory;
  published: boolean;
  position: number;
  updated_at: string;
};

export async function listSupportArticles(
  options: { includeDrafts?: boolean } = {},
): Promise<SupportArticle[]> {
  const supabase = await createClient();

  const query = supabase
    .from("support_articles")
    .select("id, slug, title, excerpt, body, category, published, position, updated_at")
    .order("position", { ascending: true })
    .order("title", { ascending: true });

  const { data } = options.includeDrafts ? await query : await query.eq("published", true);
  return (data ?? []) as unknown as SupportArticle[];
}

export async function getSupportArticle(
  slug: string,
): Promise<SupportArticle | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("support_articles")
    .select("id, slug, title, excerpt, body, category, published, position, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  return (data as unknown as SupportArticle | null) ?? null;
}

export type SupportMacro = {
  id: string;
  title: string;
  body: string;
  category: SupportCategory;
};

export async function listSupportMacros(): Promise<SupportMacro[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("support_macros")
    .select("id, title, body, category")
    .order("title", { ascending: true });

  return (data ?? []) as unknown as SupportMacro[];
}
