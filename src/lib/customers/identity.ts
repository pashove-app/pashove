/** Clé client encodée dans l'URL, sans exposer l'e-mail en clair. */
export function encodeCustomerKey(key: string): string {
  return Buffer.from(key, "utf8").toString("base64url");
}

export function decodeCustomerKey(id: string): string | null {
  try {
    const key = Buffer.from(id, "base64url").toString("utf8");
    if (!/^(email:|phone:)/.test(key) || key.length > 320) return null;
    return key;
  } catch {
    return null;
  }
}
