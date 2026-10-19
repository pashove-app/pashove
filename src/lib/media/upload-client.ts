import type { MediaKind } from "@/lib/r2/media";

export type UploadResult = { id: string; url?: string; name?: string };

/**
 * Erreur d'envoi porteuse d'un code stable, pour que l'interface distingue
 * un refus de signature (403), un CORS bloqué, un bucket absent ou une
 * configuration manquante.
 */
export class UploadError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "UploadError";
    this.code = code;
  }
}

async function errorCode(response: Response, prefix: string): Promise<UploadError> {
  const payload = (await response.json().catch(() => null)) as { error?: unknown } | null;
  const detail = typeof payload?.error === "string" ? payload.error : String(response.status);
  return new UploadError(`${prefix}_${detail}`);
}

/**
 * Certains navigateurs annoncent `application/octet-stream` pour un PDF ou un
 * ZIP. On retombe alors sur l'extension : c'est elle qui décide du type signé.
 */
const EXTENSION_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  zip: "application/zip",
  epub: "application/epub+zip",
  mp3: "audio/mpeg",
};

export function fileContentType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[extension] ?? file.type;
}

/**
 * Envoi direct vers R2 : préparation côté serveur, `PUT` depuis le navigateur,
 * puis vérification serveur de l'objet. Le fichier ne traverse jamais Next.
 */
export async function uploadWithPresign(
  file: File,
  kind: MediaKind,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  const contentType = fileContentType(file);

  const presign = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, contentType, size: file.size }),
  });

  if (!presign.ok) throw await errorCode(presign, "presign");

  const { uploadUrl, key } = (await presign.json()) as {
    uploadUrl: string;
    key: string;
  };

  await putFile(uploadUrl, file, contentType, onProgress);

  // Les dimensions ne concernent que les images.
  const dimensions = kind === "digital_file" ? null : await readDimensions(file);

  const complete = await fetch("/api/uploads/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key,
      width: dimensions?.width,
      height: dimensions?.height,
      fileName: file.name,
    }),
  });

  if (!complete.ok) throw await errorCode(complete, "complete");

  return (await complete.json()) as UploadResult;
}

/** `fetch` ne donne pas la progression ; `XMLHttpRequest` si. */
function putFile(
  url: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", contentType);

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new UploadError(`put_${request.status}`));
    };
    request.onerror = () => reject(new UploadError("put_network"));
    request.onabort = () => reject(new UploadError("put_aborted"));

    request.send(file);
  });
}

async function readDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  } catch {
    return null;
  }
}
