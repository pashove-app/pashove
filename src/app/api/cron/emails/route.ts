import { NextResponse } from "next/server";
import { deliverEmail } from "@/lib/email/transport";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 3;
const RETRY_MINUTES = 15;

type QueueRow = {
  id: string;
  template: string;
  recipient: string;
  subject: string;
  html: string;
  text_body: string | null;
  attempts: number;
};

/**
 * Reprise des e-mails en échec.
 *
 * Protégée par `CRON_SECRET` : Vercel Cron envoie automatiquement
 * `Authorization: Bearer <CRON_SECRET>`. Chaque passage traite au plus
 * 25 messages pour rester dans le budget d'exécution d'une fonction.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");

  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      { error: "service_role_missing" },
      { status: 503 },
    );
  }

  const now = new Date();

  const { data, error } = await service
    .from("email_messages")
    .select("id, template, recipient, subject, html, text_body, attempts")
    .in("status", ["queued", "failed"])
    .lte("scheduled_at", now.toISOString())
    .lt("attempts", MAX_ATTEMPTS)
    .order("scheduled_at", { ascending: true })
    .limit(25);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as QueueRow[];
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const result = await deliverEmail({
      to: row.recipient,
      subject: row.subject,
      html: row.html,
      text: row.text_body ?? "",
      template: row.template,
    });

    const attempts = row.attempts + 1;

    await service
      .from("email_messages")
      .update({
        status: result.ok ? "sent" : "failed",
        attempts,
        last_error: result.error ?? null,
        provider: result.provider,
        provider_id: result.id ?? null,
        sent_at: result.ok ? new Date().toISOString() : null,
        scheduled_at: new Date(
          Date.now() + RETRY_MINUTES * 60 * 1000,
        ).toISOString(),
      })
      .eq("id", row.id);

    if (result.ok) sent += 1;
    else failed += 1;
  }

  return NextResponse.json({ processed: rows.length, sent, failed });
}
