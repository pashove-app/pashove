import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  buildObjectKey,
  isPrivateKind,
  type MediaKind,
} from "@/lib/r2/media";

/**
 * Cloudflare R2, par son API compatible S3.
 *
 * Deux buckets : le public pour les images de vitrine, le privé pour les
 * fichiers vendus. Le choix dépend du type d'objet, jamais du client.
 */
const PRESIGN_TTL_SECONDS = 300;

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ENDPOINT &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_PUBLIC_URL,
  );
}

export function isPrivateBucketConfigured(): boolean {
  return Boolean(
    process.env.R2_ENDPOINT &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_PRIVATE_BUCKET,
  );
}

/** Vrai si le stockage nécessaire à ce type d'objet est configuré. */
export function isStorageConfigured(kind: MediaKind): boolean {
  return isPrivateKind(kind) ? isPrivateBucketConfigured() : isR2Configured();
}

function bucketFor(kind: MediaKind): string {
  return isPrivateKind(kind)
    ? process.env.R2_PRIVATE_BUCKET!
    : process.env.R2_BUCKET!;
}

function client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

/** Autorise un `PUT` direct depuis le navigateur, pour une clé déjà décidée. */
export async function signUpload(params: {
  storeId: string;
  kind: MediaKind;
  contentType: string;
}): Promise<{ key: string; uploadUrl: string; expiresIn: number }> {
  const key = buildObjectKey(params.storeId, params.kind, params.contentType);

  const command = new PutObjectCommand({
    Bucket: bucketFor(params.kind),
    Key: key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(client(), command, {
    expiresIn: PRESIGN_TTL_SECONDS,
  });

  return { key, uploadUrl, expiresIn: PRESIGN_TTL_SECONDS };
}

/** Envoie un objet côté serveur (pièce jointe de messagerie). */
export async function uploadObject(params: {
  storeId: string;
  kind: MediaKind;
  contentType: string;
  body: Uint8Array;
}): Promise<string> {
  const key = buildObjectKey(params.storeId, params.kind, params.contentType);

  await client().send(
    new PutObjectCommand({
      Bucket: bucketFor(params.kind),
      Key: key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );

  return key;
}

/** Relit l'objet après l'envoi : la seule preuve qu'il est bien arrivé. */
export async function inspectObject(
  key: string,
  kind: MediaKind,
): Promise<{ size: number; contentType: string } | null> {
  try {
    const head = await client().send(
      new HeadObjectCommand({ Bucket: bucketFor(kind), Key: key }),
    );

    return {
      size: head.ContentLength ?? 0,
      contentType: head.ContentType ?? "",
    };
  } catch {
    return null;
  }
}

/** Lien de lecture temporaire pour un objet privé (documents KYC, fichiers). */
export async function signDownload(
  key: string,
  kind: MediaKind,
  expiresIn = PRESIGN_TTL_SECONDS,
): Promise<string> {
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: bucketFor(kind), Key: key }),
    { expiresIn },
  );
}

/** Supprime l'objet du bon bucket. Appelé après la suppression de sa ligne. */
export async function deleteObject(key: string, kind: MediaKind): Promise<void> {
  await client().send(
    new DeleteObjectCommand({ Bucket: bucketFor(kind), Key: key }),
  );
}
