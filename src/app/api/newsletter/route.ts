import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().email().max(254),
  locale: z.enum(["fr", "en"]).default("fr"),
  source: z.string().max(40).optional(),
  // Champ piège : un vrai visiteur le laisse vide.
  company: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_email" }, { status: 422 });
  }

  // Réponse neutre pour les robots : on ne leur apprend rien.
  if (parsed.data.company) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createPublicClient();
  const { error } = await supabase.rpc("newsletter_subscribe", {
    p_email: parsed.data.email,
    p_locale: parsed.data.locale,
    p_source: parsed.data.source ?? "site",
  });

  if (error) {
    console.error("[newsletter] subscribe failed", error.message);
    return NextResponse.json({ error: "subscribe_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
