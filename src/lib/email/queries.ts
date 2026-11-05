import { createClient } from "@/lib/supabase/server";

export type EmailMessageStatus = "queued" | "sent" | "failed" | "skipped";

export type EmailMessage = {
  id: string;
  store_id: string | null;
  template: string;
  recipient: string;
  subject: string;
  status: EmailMessageStatus;
  attempts: number;
  last_error: string | null;
  provider: string | null;
  provider_id: string | null;
  created_at: string;
  sent_at: string | null;
};

const COLUMNS = [
  "id, store_id, template, recipient, subject, status, attempts",
  "last_error, provider, provider_id, created_at, sent_at",
].join(", ");

/** Derniers e-mails, tous statuts confondus. Lecture réservée aux admins. */
export async function listEmailMessages(
  limit = 60,
  status?: EmailMessageStatus,
): Promise<EmailMessage[]> {
  const supabase = await createClient();

  let query = supabase
    .from("email_messages")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);

  const { data } = await query;
  return (data ?? []) as unknown as EmailMessage[];
}

export async function getEmailMessage(id: string): Promise<
  | (EmailMessage & { html: string; text_body: string | null })
  | null
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("email_messages")
    .select(`${COLUMNS}, html, text_body`)
    .eq("id", id)
    .maybeSingle();

  return (
    (data as (EmailMessage & { html: string; text_body: string | null }) | null) ??
    null
  );
}

export type EmailCounts = {
  sent: number;
  failed: number;
  queued: number;
};

export async function emailCounts(): Promise<EmailCounts> {
  const supabase = await createClient();
  const counts: EmailCounts = { sent: 0, failed: 0, queued: 0 };

  for (const status of ["sent", "failed", "queued"] as const) {
    const { count } = await supabase
      .from("email_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", status);

    counts[status] = count ?? 0;
  }

  return counts;
}
