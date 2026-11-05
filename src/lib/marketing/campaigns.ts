import { createClient } from "@/lib/supabase/server";

export type Campaign = {
  id: string;
  subject: string;
  body: string;
  segment: "buyers" | "all" | "digital";
  status: "draft" | "sending" | "sent" | "failed";
  recipient_count: number;
  sent_count: number;
  created_at: string;
  sent_at: string | null;
};

const COLUMNS =
  "id, subject, body, segment, status, recipient_count, sent_count, created_at, sent_at";

export async function listCampaigns(storeId: string): Promise<Campaign[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("email_campaigns")
    .select(COLUMNS)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(30);

  return (data ?? []) as Campaign[];
}
