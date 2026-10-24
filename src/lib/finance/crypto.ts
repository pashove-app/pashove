import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";

const VERSION = "v1";

/** Clé AES-256-GCM, en base64, fournie par l'environnement serveur. */
function encryptionKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) return null;

  try {
    const key = Buffer.from(raw, "base64");
    return key.length === 32 ? key : null;
  } catch {
    return null;
  }
}

export function isPayoutEncryptionConfigured(): boolean {
  return encryptionKey() !== null;
}

/** Chiffre un numéro de retrait : IV + tag + texte, en base64 versionné. */
export function encryptPayoutNumber(value: string): string {
  const key = encryptionKey();
  if (!key) throw new Error("encryption_not_configured");

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${VERSION}:${Buffer.concat([iv, tag, encrypted]).toString("base64")}`;
}

export function decryptPayoutNumber(payload: string): string {
  const key = encryptionKey();
  if (!key) throw new Error("encryption_not_configured");

  const [version, encoded] = payload.split(":");
  if (version !== VERSION || !encoded) throw new Error("invalid_payload");

  const data = Buffer.from(encoded, "base64");
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const encrypted = data.subarray(28);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

/** Empreinte non réversible, pour détecter un doublon sans déchiffrer. */
export function fingerprintPayoutNumber(value: string): string {
  const key = encryptionKey();
  if (!key) throw new Error("encryption_not_configured");

  return createHmac("sha256", key)
    .update(`payout:${value}`)
    .digest("hex");
}

/** Chiffres uniquement : les espaces, tirets et le « + » ne sont pas utiles. */
export function normalizePayoutNumber(value: string): string {
  return value.replace(/\D/g, "");
}

export function lastFour(value: string): string {
  return value.slice(-4).padStart(4, "0");
}
