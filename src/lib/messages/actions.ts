"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { signDownload, uploadObject } from "@/lib/r2/client";
import {
  isAllowedChatType,
  MAX_CHAT_BYTES,
} from "@/lib/r2/media";
import type {
  ChatConversation,
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

const signedAttachments = new Map<
  string,
  { url: string; expiresAt: number }
>();

async function signChatAttachment(objectKey: string): Promise<string> {
  const now = Date.now();
  const cached = signedAttachments.get(objectKey);

  if (cached && cached.expiresAt > now + 60_000) {
    return cached.url;
  }

  const url = await signDownload(objectKey, "chat_attachment", 3600);
  signedAttachments.set(objectKey, {
    url,
    expiresAt: now + 3_600_000,
  });

  return url;
}

type RawMessage = Omit<ChatMessage, "attachment"> & {
  attachment?: {
    objectKey: string;
    contentType: string;
    fileName: string | null;
  } | null;
};

async function withSignedAttachment(
  message: RawMessage,
): Promise<ChatMessage> {
  if (!message.attachment) {
    return { ...message, attachment: null };
  }

  try {
    const url = await signChatAttachment(message.attachment.objectKey);

    return {
      ...message,
      attachment: {
        url,
        contentType: message.attachment.contentType,
        fileName: message.attachment.fileName,
      },
    };
  } catch {
    return { ...message, attachment: null };
  }
}

export async function listConversationsAction(
  scope: "merchant" | "platform",
): Promise<ChatConversation[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("chat_conversations", {
    p_scope: scope,
  });
  return (data ?? []) as ChatConversation[];
}

export async function loadMessagesAction(
  conversationId: string,
): Promise<ChatMessage[]> {
  if (!isUuid(conversationId) || !isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let data: unknown = null;

  // Même protection que l'envoi : une relance si le cache PostgREST vient
  // d'être rechargé, sinon le fil paraît vide jusqu'au prochain rafraîchissement.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await supabase.rpc("chat_messages", {
      p_conversation_id: conversationId,
    });

    data = result.data;

    if (!result.error && result.data) break;
    if (attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  return Promise.all(
    ((data ?? []) as RawMessage[]).map((message) =>
      withSignedAttachment(message),
    ),
  );
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
  let data: unknown = null;
  let lastError: { message?: string } | null = null;

  // Une relance couvre le rechargement du cache PostgREST juste après une
  // migration, sans jamais dupliquer : la RPC est atomique par message.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await supabase.rpc("chat_send_message", {
      p_conversation_id: input.conversationId,
      p_body: body,
      p_role: input.role,
      p_attachment: null,
    });

    data = result.data;
    lastError = result.error;

    if (!result.error && result.data) break;
    if (attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  if (lastError || !data) {
    if (process.env.NODE_ENV !== "production") {
      console.error("chat_send_message", lastError?.message);
    }
    return { ok: false, error: "unavailable" };
  }

  revalidatePath("/", "layout");
  return {
    ok: true,
    message: await withSignedAttachment(data as RawMessage),
  };
}

/** Envoie une image, une vidéo courte ou un PDF avec un texte facultatif. */
export async function sendChatAttachmentAction(
  formData: FormData,
): Promise<SendMessageResult> {
  const conversationId = formData.get("conversationId");
  const role = formData.get("role");
  const body =
    typeof formData.get("body") === "string"
      ? String(formData.get("body")).trim().slice(0, 4000)
      : "";
  const file = formData.get("file");

  if (
    !isUuid(conversationId) ||
    !isRole(role) ||
    !(file instanceof File) ||
    file.size <= 0
  ) {
    return { ok: false, error: "invalid" };
  }

  if (file.size > MAX_CHAT_BYTES || !isAllowedChatType(file.type)) {
    return { ok: false, error: "invalid" };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "unavailable" };
  }

  const supabase = await createClient();
  const { data: storeId } = await supabase.rpc("chat_attachment_store", {
    p_conversation_id: conversationId,
    p_role: role,
  });

  if (typeof storeId !== "string" || !isUuid(storeId)) {
    return { ok: false, error: "unavailable" };
  }

  const objectKey = await uploadObject({
    storeId,
    kind: "chat_attachment",
    contentType: file.type,
    body: new Uint8Array(await file.arrayBuffer()),
  });

  let data: unknown = null;
  let lastError: { message?: string } | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await supabase.rpc("chat_send_message", {
      p_conversation_id: conversationId,
      p_body: body,
      p_role: role,
      p_attachment: {
        objectKey,
        contentType: file.type,
        fileName: file.name.slice(0, 255),
      },
    });

    data = result.data;
    lastError = result.error;

    if (!result.error && result.data) break;
    if (attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  if (lastError || !data) {
    if (process.env.NODE_ENV !== "production") {
      console.error("chat_send_message attachment", lastError?.message);
    }
    return { ok: false, error: "unavailable" };
  }

  revalidatePath("/", "layout");
  return {
    ok: true,
    message: await withSignedAttachment(data as RawMessage),
  };
}
