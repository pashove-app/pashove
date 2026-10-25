/**
 * Règles des médias, partagées par les routes d'upload et les composants client.
 *
 * Deux natures d'objets : les images de vitrine, publiques, et les fichiers
 * vendus, privés. Leur taille et leurs formats n'ont rien à voir.
 */

export const MEDIA_KINDS = [
  "logo",
  "banner",
  "product",
  "digital_file",
  "kyc_document",
] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;

export const FILE_EXTENSIONS = {
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "application/epub+zip": "epub",
  "audio/mpeg": "mp3",
} as const;

export type AllowedImageType = keyof typeof IMAGE_EXTENSIONS;
export type AllowedFileType = keyof typeof FILE_EXTENSIONS;

/** 5 Mo : une photo de produit. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** 100 Mo : un PDF, un ZIP ou un EPUB vendu. */
export const MAX_FILE_BYTES = 100 * 1024 * 1024;

/** Un fichier vendu ou un document KYC ne doit jamais être public. */
export function isPrivateKind(kind: MediaKind): boolean {
  return kind === "digital_file" || kind === "kyc_document";
}

/** Seul un fichier vendu accepte les formats documentaires. */
export function isFileKind(kind: MediaKind): boolean {
  return kind === "digital_file";
}

export function isAllowedImageType(value: unknown): value is AllowedImageType {
  return typeof value === "string" && value in IMAGE_EXTENSIONS;
}

export function isAllowedFileType(value: unknown): value is AllowedFileType {
  return typeof value === "string" && value in FILE_EXTENSIONS;
}

export function isMediaKind(value: unknown): value is MediaKind {
  return typeof value === "string" && (MEDIA_KINDS as readonly string[]).includes(value);
}

/** Taille maximale selon la nature de l'objet. */
export function maxBytesFor(kind: MediaKind): number {
  return isFileKind(kind) ? MAX_FILE_BYTES : MAX_IMAGE_BYTES;
}

export function maxLabelFor(kind: MediaKind): string {
  return isFileKind(kind) ? "100 Mo" : "5 Mo";
}

const ALL_EXTENSIONS: Record<string, string> = {
  ...IMAGE_EXTENSIONS,
  ...FILE_EXTENSIONS,
};

/**
 * Clé de l'objet dans le bucket.
 *
 * Le préfixe porte la boutique : un marchand ne peut pas écrire dans l'espace
 * d'un autre. Le nom de fichier du client n'est jamais réutilisé.
 */
export function buildObjectKey(
  storeId: string,
  kind: MediaKind,
  contentType: string,
): string {
  const extension = ALL_EXTENSIONS[contentType] ?? "bin";
  return `stores/${storeId}/${kind}/${crypto.randomUUID()}.${extension}`;
}

const KEY_PATTERN =
  /^stores\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/(logo|banner|product|digital_file|kyc_document)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$/i;

/** Relit une clé et vérifie qu'elle respecte la forme attendue. */
export function parseObjectKey(
  key: unknown,
): { storeId: string; kind: MediaKind } | null {
  if (typeof key !== "string") return null;
  const match = KEY_PATTERN.exec(key);
  if (!match) return null;
  return { storeId: match[1], kind: match[2] as MediaKind };
}

/** URL publique d'un objet. Réservée aux objets publics. */
export function publicUrl(key: string): string {
  const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
  return `${base}/${key}`;
}
