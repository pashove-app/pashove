"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashApiKey } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { currentMembership } from "@/lib/stores/queries";

export type ApiKeyState = {
  status: "idle" | "saved" | "error";
  key?: string;
  message?: string;
};

const schema = z.object({
  name: z.string().trim().min(2).max(60),
});

function canManage(role: string | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export async function createApiKeyAction(
  _previous: ApiKeyState,
  formData: FormData,
): Promise<ApiKeyState> {
  const membership = await currentMembership();
  if (!membership || !canManage(membership.role)) {
    return { status: "error", message: "Tu n’as pas le droit de créer une clé." };
  }

  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { status: "error", message: "Donne un nom entre 2 et 60 caractères." };
  }

  const service = createServiceClient();
  if (!service) {
    return { status: "error", message: "Service indisponible. Réessaie plus tard." };
  }

  const raw = `pk_live_${randomBytes(24).toString("hex")}`;
  const prefix = raw.slice(0, 16);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await service.from("api_keys").insert({
    store_id: membership.store.id,
    name: parsed.data.name,
    prefix,
    key_hash: hashApiKey(raw),
    scopes: ["read"],
    created_by: user?.id ?? null,
  });

  if (error) {
    console.error("[api-keys] create failed", error);
    return { status: "error", message: "La clé n’a pas pu être créée." };
  }

  revalidatePath("/", "layout");
  return { status: "saved", key: raw };
}

export async function revokeApiKeyAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const membership = await currentMembership();
  if (!membership || !canManage(membership.role)) return;

  const service = createServiceClient();
  if (!service) return;

  await service
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("store_id", membership.store.id);

  revalidatePath("/", "layout");
}
