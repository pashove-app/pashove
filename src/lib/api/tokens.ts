import { createHash } from "node:crypto";

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
