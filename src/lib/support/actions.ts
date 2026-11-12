"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { currentStore } from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type SupportActionState = {
  status: "idle" | "saved" | "error";
  messageKey?: string;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function value(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function ticketError(error: { message?: string }): string {
  const message = error.message ?? "";
  if (message.includes("too_many_tickets")) return "tooManyTickets";
  if (message.includes("subject_invalid")) return "subjectInvalid";
  if (message.includes("message_invalid")) return "messageInvalid";
  if (message.includes("ticket_closed")) return "ticketClosed";
  if (message.includes("not_allowed")) return "notAllowed";
  return "actionFailed";
}

const ticketSchema = z.object({
  subject: z.string().trim().min(4).max(140),
  category: z.enum(["payments", "orders", "inventory", "delivery", "account", "other"]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  body: z.string().trim().min(2).max(4000),
});

export async function createTicketAction(
  _previous: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  if (!isSupabaseConfigured()) return { status: "error", messageKey: "actionFailed" };

  const store = await currentStore();
  if (!store) return { status: "error", messageKey: "notAllowed" };

  const parsed = ticketSchema.safeParse({
    subject: value(formData, "subject"),
    category: value(formData, "category"),
    priority: value(formData, "priority"),
    body: value(formData, "body"),
  });

  if (!parsed.success) return { status: "error", messageKey: "subjectInvalid" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_support_ticket", {
    p_store_id: store.id,
    p_subject: parsed.data.subject,
    p_category: parsed.data.category,
    p_priority: parsed.data.priority,
    p_body: parsed.data.body,
  });

  if (error) return { status: "error", messageKey: ticketError(error) };

  revalidatePath("/", "layout");
  const locale = value(formData, "locale") || "fr";
  redirect(`/${locale}/app/support/tickets/${data as string}`);
}

export async function replyTicketAction(
  _previous: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  const ticketId = value(formData, "ticketId");
  const body = value(formData, "body");

  if (!UUID.test(ticketId)) return { status: "error", messageKey: "actionFailed" };
  if (body.length < 1 || body.length > 4000) {
    return { status: "error", messageKey: "messageInvalid" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("reply_support_ticket", {
    p_ticket_id: ticketId,
    p_body: body,
  });

  if (error) return { status: "error", messageKey: ticketError(error) };

  revalidatePath("/", "layout");
  return { status: "saved", messageKey: "replySaved" };
}

export async function setTicketStatusAction(formData: FormData): Promise<void> {
  const ticketId = value(formData, "ticketId");
  const status = value(formData, "status");
  const locale = value(formData, "locale") || "fr";
  const back = value(formData, "back") || `/${locale}/app/support/tickets`;

  if (!UUID.test(ticketId)) redirect(back);

  const supabase = await createClient();
  await supabase.rpc("set_support_ticket_status", {
    p_ticket_id: ticketId,
    p_status: status,
  });

  revalidatePath("/", "layout");
  redirect(back);
}

const macroSchema = z.object({
  title: z.string().trim().min(2).max(80),
  body: z.string().trim().min(2).max(4000),
  category: z.enum(["payments", "orders", "inventory", "delivery", "account", "other"]),
});

export async function createMacroAction(formData: FormData): Promise<void> {
  const parsed = macroSchema.safeParse({
    title: value(formData, "title"),
    body: value(formData, "body"),
    category: value(formData, "category"),
  });

  if (!parsed.success) redirect("/platform-admin/support?tab=macros&error=macro");

  const supabase = await createClient();
  await supabase.from("support_macros").insert({
    title: parsed.data.title,
    body: parsed.data.body,
    category: parsed.data.category,
  });

  revalidatePath("/", "layout");
  redirect("/platform-admin/support?tab=macros&ok=macro");
}

const articleSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9-]{0,78}[a-z0-9]$/),
  title: z.string().trim().min(3).max(140),
  excerpt: z.string().trim().max(300).optional(),
  body: z.string().trim().min(10).max(20000),
  category: z.enum(["payments", "orders", "inventory", "delivery", "account", "other"]),
});

export async function createArticleAction(formData: FormData): Promise<void> {
  const parsed = articleSchema.safeParse({
    slug: value(formData, "slug"),
    title: value(formData, "title"),
    excerpt: value(formData, "excerpt"),
    body: value(formData, "body"),
    category: value(formData, "category"),
  });

  if (!parsed.success) redirect("/platform-admin/support?tab=articles&error=article");

  const supabase = await createClient();
  await supabase.from("support_articles").insert({
    slug: parsed.data.slug,
    title: parsed.data.title,
    excerpt: parsed.data.excerpt || null,
    body: parsed.data.body,
    category: parsed.data.category,
  });

  revalidatePath("/", "layout");
  redirect("/platform-admin/support?tab=articles&ok=article");
}

export async function assignToMeAction(formData: FormData): Promise<void> {
  const ticketId = value(formData, "ticketId");
  const back = value(formData, "back") || "/platform-admin/support";
  if (!UUID.test(ticketId)) redirect(back);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(back);

  await supabase.rpc("assign_support_ticket", {
    p_ticket_id: ticketId,
    p_admin_id: user.id,
  });

  revalidatePath("/", "layout");
  redirect(back);
}
