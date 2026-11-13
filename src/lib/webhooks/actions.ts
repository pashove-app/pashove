"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { currentMembership } from "@/lib/stores/queries";
import {
  isSafeWebhookUrl,
  WEBHOOK_EVENTS,
} from "@/lib/webhooks/signing";

export type WebhookFormState = {
  status: "idle" | "saved" | "error";
  secret?: string;
  message?: string;
};

const schema = z.object({
  url: z.string().url().max(500),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
});

function canManage(role: string | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export async function createWebhookAction(
  _previous: WebhookFormState,
  formData: FormData,
): Promise<WebhookFormState> {
  const membership = await currentMembership();
  if (!membership || !canManage(membership.role)) {
    return { status: "error", message: "Tu n’as pas le droit de gérer les webhooks." };
  }

  const url = String(formData.get("url") ?? "").trim();
  const events = formData
    .getAll("events")
    .filter((value): value is string => typeof value === "string");

  const parsed = schema.safeParse({ url, events });
  if (!parsed.success) {
    return { status: "error", message: "Vérifie l’URL et choisis au moins un événement." };
  }

  if (!isSafeWebhookUrl(parsed.data.url)) {
    return {
      status: "error",
      message: "L’URL doit être HTTPS, publique, sans identifiants intégrés.",
    };
  }

  const secret = randomBytes(32).toString("hex");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("webhook_endpoints").insert({
    store_id: membership.store.id,
    url: parsed.data.url,
    secret,
    events: parsed.data.events,
    created_by: user?.id ?? null,
  });

  if (error) {
    console.error("[webhooks] create failed", error);
    return { status: "error", message: "Le webhook n’a pas pu être créé." };
  }

  revalidatePath("/", "layout");
  return { status: "saved", secret };
}

export async function toggleWebhookAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  const membership = await currentMembership();
  if (!membership || !canManage(membership.role) || !id) return;

  const supabase = await createClient();
  await supabase
    .from("webhook_endpoints")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("store_id", membership.store.id);

  revalidatePath("/", "layout");
}

export async function deleteWebhookAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const membership = await currentMembership();
  if (!membership || !canManage(membership.role) || !id) return;

  const supabase = await createClient();
  await supabase
    .from("webhook_endpoints")
    .delete()
    .eq("id", id)
    .eq("store_id", membership.store.id);

  revalidatePath("/", "layout");
}
