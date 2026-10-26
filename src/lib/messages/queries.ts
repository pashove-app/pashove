import { createClient } from "@/lib/supabase/server";
import type {
  ChatConversation,
  ChatMessage,
  ChatSession,
} from "@/lib/messages/types";

export async function openCustomerChat(
  slug: string,
): Promise<ChatSession | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("chat_open_customer", { p_slug: slug });
  return (data as ChatSession | null) ?? null;
}

export async function openSupportChat(
  storeId: string,
): Promise<ChatSession | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("chat_open_support", {
    p_store_id: storeId,
  });
  return (data as ChatSession | null) ?? null;
}

export async function listConversations(
  scope: "merchant" | "platform",
): Promise<ChatConversation[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("chat_conversations", {
    p_scope: scope,
  });
  return (data ?? []) as ChatConversation[];
}

export async function listMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("chat_messages", {
    p_conversation_id: conversationId,
  });
  return (data ?? []) as ChatMessage[];
}
