import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  buildObjectKey,
  type AllowedImageType,
  type MediaKind,
} from "@/lib/r2/media";

/**
 * Cloudflare R2, par son API compatible S3.
 *
 * Le point d'entrée porte déjà l'identifiant de compte : une seule variable
 * suffit, `R2_ENDPOINT`, et `forcePathStyle` évite de dépendre du style
 * d'adressage des buckets.
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

function bucketName(): string {
  return process.env.R2_BUCKET!;
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
  contentType: AllowedImageType;
}): Promise<{ key: string; uploadUrl: string; expiresIn: number }> {
  const key = buildObjectKey(params.storeId, params.kind, params.contentType);

  const command = new PutObjectCommand({
    Bucket: bucketName(),
    Key: key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(client(), command, {
    expiresIn: PRESIGN_TTL_SECONDS,
  });

  return { key, uploadUrl, expiresIn: PRESIGN_TTL_SECONDS };
}

/**
 * Relit l'objet après l'envoi : c'est la seule preuve que le fichier est bien
 * arrivé, avec la taille et le type annoncés.
 */
export async function inspectObject(
  key: string,
): Promise<{ size: number; contentType: string } | null> {
  try {
    const head = await client().send(
      new HeadObjectCommand({ Bucket: bucketName(), Key: key }),
    );

    return {
      size: head.ContentLength ?? 0,
      contentType: head.ContentType ?? "",
    };
  } catch {
    return null;
  }
}

/** Supprime l'objet du bucket. Appelé après la suppression de sa ligne. */
export async function deleteObject(key: string): Promise<void> {
  await client().send(
    new DeleteObjectCommand({ Bucket: bucketName(), Key: key }),
  );
}
