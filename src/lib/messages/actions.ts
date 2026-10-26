"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  ChatMessage,
  ChatRole,
  ChatSession,
} from "@/lib/messages/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_PATTERN.test(value);

const isRole = (value: unknown): value is ChatRole =>
  value === "customer" || value === "merchant" || value === "platform";

export async function openCustomerChatAction(
  slug: string,
): Promise<ChatSession | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("chat_open_customer", {
    p_slug: slug.slice(0, 120),
  });
  return (data as ChatSession | null) ?? null;
}

export async function openSupportChatAction(
  storeId: string,
): Promise<ChatSession | null> {
  if (!isUuid(storeId) || !isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("chat_open_support", {
    p_store_id: storeId,
  });
  return (data as ChatSession | null) ?? null;
}

export async function loadMessagesAction(
  conversationId: string,
): Promise<ChatMessage[]> {
  if (!isUuid(conversationId) || !isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("chat_messages", {
    p_conversation_id: conversationId,
  });
  return (data ?? []) as ChatMessage[];
}

export type SendMessageResult = {
  ok: boolean;
  message?: ChatMessage;
  error?: "invalid" | "unavailable";
};

export async function sendMessageAction(input: {
  conversationId: string;
  body: string;
  role: ChatRole;
}): Promise<SendMessageResult> {
  const body = typeof input.body === "string" ? input.body.trim().slice(0, 4000) : "";

  if (
    !isUuid(input.conversationId) ||
    !isRole(input.role) ||
    body.length === 0
  ) {
    return { ok: false, error: "invalid" };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "unavailable" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("chat_send_message", {
    p_conversation_id: input.conversationId,
    p_body: body,
    p_role: input.role,
  });

  if (error || !data) {
    return { ok: false, error: "unavailable" };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: data as ChatMessage };
}
