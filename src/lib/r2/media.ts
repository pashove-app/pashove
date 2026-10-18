/**
 * Règles des médias, partagées par les routes d'upload et le composant client.
 *
 * Aucune dépendance à AWS ici : ce module ne manipule que des types, des clés
 * et des URL. Il peut être lu des deux côtés.
 */

export const MEDIA_KINDS = ["logo", "banner", "product"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;

export type AllowedImageType = keyof typeof IMAGE_EXTENSIONS;

/** 5 Mo : largement assez pour une photo de produit, assez peu pour ne pas
 *  laisser un marchand téléverser un fichier brut de 40 Mo. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function isAllowedImageType(value: unknown): value is AllowedImageType {
  return typeof value === "string" && value in IMAGE_EXTENSIONS;
}

export function isMediaKind(value: unknown): value is MediaKind {
  return typeof value === "string" && (MEDIA_KINDS as readonly string[]).includes(value);
}

/**
 * Clé de l'objet dans le bucket.
 *
 * Le préfixe porte la boutique : un marchand ne peut pas écrire dans l'espace
 * d'un autre, et un objet orphelin se retrouve immédiatement. Le nom de fichier
 * du client n'est jamais réutilisé — il peut contenir n'importe quoi.
 */
export function buildObjectKey(
  storeId: string,
  kind: MediaKind,
  contentType: AllowedImageType,
): string {
  return `stores/${storeId}/${kind}/${crypto.randomUUID()}.${IMAGE_EXTENSIONS[contentType]}`;
}

const KEY_PATTERN =
  /^stores\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/(logo|banner|product)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$/i;

/** Relit une clé et vérifie qu'elle respecte la forme attendue. */
export function parseObjectKey(
  key: unknown,
): { storeId: string; kind: MediaKind } | null {
  if (typeof key !== "string") return null;
  const match = KEY_PATTERN.exec(key);
  if (!match) return null;
  return { storeId: match[1], kind: match[2] as MediaKind };
}

/** URL publique d'un objet, déduite de sa clé. */
export function publicUrl(key: string): string {
  const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
  return `${base}/${key}`;
}
