import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isSafeWebhookUrl, webhookSignature } from "@/lib/webhooks/signing";

export const dynamic = "force-dynamic";

const BACKOFF_SECONDS = [60, 300, 1800, 7200, 43200];
const MAX_ATTEMPTS = 6;
const BATCH = 20;

type Row = {
  id: string;
  attempts: number;
  payload: unknown;
  event: string;
  endpoint: {
    url: string;
    secret: string;
    active: boolean;
  } | {
    url: string;
    secret: string;
    active: boolean;
  }[] | null;
};

/** Livre les webhooks en attente, signés et idempotents. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: "service_role_missing" }, { status: 503 });
  }

  const { data } = await service
    .from("webhook_deliveries")
    .select(
      "id, attempts, payload, event, endpoint:webhook_endpoints(url, secret, active)",
    )
    .eq("status", "pending")
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at", { ascending: true })
    .limit(BATCH);

  const counts = { sent: 0, retried: 0, failed: 0, skipped: 0 };

  for (const row of (data ?? []) as unknown as Row[]) {
    const endpoint = Array.isArray(row.endpoint) ? row.endpoint[0] : row.endpoint;

    if (!endpoint || !endpoint.active || !isSafeWebhookUrl(endpoint.url)) {
      await service
        .from("webhook_deliveries")
        .update({
          status: "failed",
          last_error: !endpoint
            ? "endpoint_missing"
            : !endpoint.active
              ? "endpoint_inactive"
              : "unsafe_url",
        })
        .eq("id", row.id);
      counts.skipped += 1;
      continue;
    }

    const body = JSON.stringify(row.payload);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const attempt = row.attempts + 1;

    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Pashove-Webhooks/1.0",
          "X-Pashove-Event": row.event,
          "X-Pashove-Delivery": row.id,
          "X-Pashove-Timestamp": timestamp,
          "X-Pashove-Signature": webhookSignature(endpoint.secret, body, timestamp),
        },
        body,
      });

      if (response.ok) {
        await service
          .from("webhook_deliveries")
          .update({
            status: "success",
            attempts: attempt,
            response_status: response.status,
            delivered_at: new Date().toISOString(),
            last_error: null,
          })
          .eq("id", row.id);
        counts.sent += 1;
        continue;
      }

      throw new Error(`http_${response.status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "network_error";
      const permanent = attempt >= MAX_ATTEMPTS;
      const delay = BACKOFF_SECONDS[Math.min(attempt - 1, BACKOFF_SECONDS.length - 1)];

      await service
        .from("webhook_deliveries")
        .update({
          status: permanent ? "failed" : "pending",
          attempts: attempt,
          last_error: message.slice(0, 300),
          next_attempt_at: new Date(Date.now() + delay * 1000).toISOString(),
        })
        .eq("id", row.id);

      if (permanent) counts.failed += 1;
      else counts.retried += 1;
    }
  }

  return NextResponse.json({ ok: true, ...counts });
}
