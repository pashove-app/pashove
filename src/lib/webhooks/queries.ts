import { createClient } from "@/lib/supabase/server";

export type WebhookEndpoint = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
};

export type WebhookDelivery = {
  id: string;
  event: string;
  status: "pending" | "success" | "failed";
  attempts: number;
  response_status: number | null;
  last_error: string | null;
  created_at: string;
  endpoint_url: string;
};

export async function listWebhookEndpoints(storeId: string): Promise<WebhookEndpoint[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("webhook_endpoints")
    .select("id, url, events, active, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as WebhookEndpoint[];
}

export async function listWebhookDeliveries(
  storeId: string,
  limit = 30,
): Promise<WebhookDelivery[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("webhook_deliveries")
    .select(
      "id, event, status, attempts, response_status, last_error, created_at, endpoint:webhook_endpoints(url)",
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as {
    id: string;
    event: string;
    status: "pending" | "success" | "failed";
    attempts: number;
    response_status: number | null;
    last_error: string | null;
    created_at: string;
    endpoint: { url: string } | { url: string }[] | null;
  }[]).map((row) => {
    const endpoint = Array.isArray(row.endpoint) ? row.endpoint[0] : row.endpoint;
    return {
      id: row.id,
      event: row.event,
      status: row.status,
      attempts: row.attempts,
      response_status: row.response_status,
      last_error: row.last_error,
      created_at: row.created_at,
      endpoint_url: endpoint?.url ?? "",
    };
  });
}
