"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { emailCampaign } from "@/lib/email/events";
import { canManageTeam, currentMembership, currentStore } from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type CampaignState = {
  status: "idle" | "error" | "queued";
  message?: string;
  count?: number;
};

const campaignSchema = z.object({
  subject: z.string().trim().min(2, "campaignSubjectInvalid").max(140),
  body: z.string().trim().min(5, "campaignBodyInvalid").max(10000),
  segment: z.enum(["buyers", "all", "digital"]),
});

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function sendCampaignAction(
  _previous: CampaignState,
  formData: FormData,
): Promise<CampaignState> {
  const locale = field(formData, "locale") || "fr";

  if (!isSupabaseConfigured()) return { status: "error", message: "Supabase indisponible." };

  const store = await currentStore();
  if (!store) return { status: "error", message: "Session expirée." };

  const membership = await currentMembership();
  if (!membership || !canManageTeam(membership.role)) {
    return { status: "error", message: "Ton rôle ne permet pas d’envoyer une campagne." };
  }

  const parsed = campaignSchema.safeParse({
    subject: field(formData, "subject"),
    body: field(formData, "body"),
    segment: field(formData, "segment") || "buyers",
  });

  if (!parsed.success) {
    return { status: "error", message: "Vérifie l’objet, le message et le segment." };
  }

  const supabase = await createClient();
  const { data: audienceData, error: audienceError } = await supabase.rpc(
    "store_audience",
    { p_store_id: store.id, p_segment: parsed.data.segment },
  );

  if (audienceError) {
    return { status: "error", message: "Impossible de charger l’audience." };
  }

  const audience = (audienceData ?? []) as { email: string; name: string }[];
  if (audience.length === 0) {
    return { status: "error", message: "Aucun contact dans ce segment." };
  }

  const limited = audience.slice(0, 200);

  const { data: campaign, error: insertError } = await supabase
    .from("email_campaigns")
    .insert({
      store_id: store.id,
      subject: parsed.data.subject,
      body: parsed.data.body,
      segment: parsed.data.segment,
      status: "sending",
      recipient_count: limited.length,
    })
    .select("id")
    .single();

  if (insertError || !campaign) {
    return { status: "error", message: "Impossible de créer la campagne." };
  }

  const campaignId = campaign.id as string;

  after(async () => {
    let sent = 0;
    for (const contact of limited) {
      try {
        await emailCampaign({
          to: contact.email,
          name: contact.name,
          storeId: store.id,
          storeName: store.name,
          storeSlug: store.slug,
          subject: parsed.data.subject,
          body: parsed.data.body,
          locale,
        });
        await supabase.from("email_campaign_recipients").insert({
          campaign_id: campaignId,
          email: contact.email,
          status: "sent",
          sent_at: new Date().toISOString(),
        });
        sent += 1;
      } catch {
        await supabase.from("email_campaign_recipients").insert({
          campaign_id: campaignId,
          email: contact.email,
          status: "failed",
          error: "send_failed",
        });
      }
    }

    await supabase
      .from("email_campaigns")
      .update({
        status: sent > 0 ? "sent" : "failed",
        sent_count: sent,
        sent_at: sent > 0 ? new Date().toISOString() : null,
      })
      .eq("id", campaignId)
      .eq("store_id", store.id);
  });

  revalidatePath(`/${locale}/app/marketing`);
  return { status: "queued", count: limited.length };
}
