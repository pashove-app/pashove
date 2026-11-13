import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export type ApiAuth = {
  keyId: string;
  storeId: string;
  scopes: string[];
};

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Extrait la clé d'un en-tête `Authorization: Bearer …`. */
export function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim() ?? "";
  return token.startsWith("pk_live_") ? token : null;
}

export async function authenticateApiRequest(
  request: Request,
): Promise<ApiAuth | null> {
  const token = bearerToken(request.headers.get("authorization"));
  if (!token) return null;

  const service = createServiceClient();
  if (!service) return null;

  const { data } = await service
    .from("api_keys")
    .select("id, store_id, scopes, revoked_at")
    .eq("key_hash", hashApiKey(token))
    .maybeSingle();

  if (!data || data.revoked_at) return null;

  void service
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => undefined);

  return {
    keyId: data.id as string,
    storeId: data.store_id as string,
    scopes: (data.scopes ?? []) as string[],
  };
}

export function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: "unauthorized", message: "Clé API absente, invalide ou révoquée." },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
  );
}

export function requireScope(auth: ApiAuth, scope: "read" | "write"): boolean {
  return auth.scopes.includes(scope);
}
