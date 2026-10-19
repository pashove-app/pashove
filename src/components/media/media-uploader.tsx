"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { buttonClass, Icon, icons, Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { uploadWithPresign } from "@/lib/media/upload-client";
import { MAX_IMAGE_BYTES, type MediaKind } from "@/lib/r2/media";

export type MediaValue = { id: string; url: string } | null;

export type MediaUploaderLabels = {
  choose: string;
  replace: string;
  remove: string;
  drop: string;
  uploading: string;
  errorType: string;
  errorSize: string;
  errorUpload: string;
};

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Téléverseur d'image : dépôt ou sélection, envoi direct vers R2, aperçu.
 *
 * Le fichier ne passe pas par le serveur. Le composant ne garde qu'un
 * identifiant dans un champ caché : la sauvegarde enregistre la référence.
 */
export function MediaUploader({
  name,
  kind,
  label,
  help,
  initial,
  labels,
  wide = false,
}: {
  name: string;
  kind: MediaKind;
  label: string;
  help: string;
  initial: MediaValue;
  labels: MediaUploaderLabels;
  wide?: boolean;
}) {
  const [media, setMedia] = useState<MediaValue>(initial);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError(labels.errorType);
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError(labels.errorSize);
      return;
    }

    setBusy(true);
    setProgress(0);

    try {
      const saved = await uploadWithPresign(file, kind, setProgress);
      setMedia({ id: saved.id, url: saved.url ?? "" });
    } catch {
      setError(labels.errorUpload);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-[0.8125rem] font-medium text-body">
          {label}
        </label>

        {media ? (
          <button
            type="button"
            onClick={() => setMedia(null)}
            className="text-[0.75rem] font-medium text-subtle transition-colors hover:text-fg"
          >
            {labels.remove}
          </button>
        ) : null}
      </div>

      <p className="mt-0.5 text-[0.75rem] text-subtle">{help}</p>

      <div className="mt-2 flex flex-wrap items-start gap-3">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!busy) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (busy) return;
            const file = event.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
          className={cn(
            "relative overflow-hidden rounded-xl border bg-hairline transition-colors",
            wide ? "h-24 w-full max-w-[16rem]" : "h-24 w-24",
            dragging ? "border-accent" : "border-border",
          )}
        >
          {media ? (
            <Image
              src={media.url}
              alt=""
              fill
              sizes="256px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-faint">
              <Icon
                path={wide ? icons.palette : icons.sparkle}
                className="h-6 w-6"
                strokeWidth={1.7}
              />
            </span>
          )}

          {busy ? (
            <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/55 text-[0.75rem] font-medium text-white">
              <Spinner />
              {progress} %
            </span>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className={buttonClass({ variant: "outline", size: "sm" })}
          >
            {media ? labels.replace : labels.choose}
          </button>
          <p className="text-[0.6875rem] text-faint">{labels.drop}</p>
        </div>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.currentTarget.value = "";
        }}
      />

      <input type="hidden" name={name} value={media?.id ?? ""} />

      {error ? (
        <p role="alert" className="mt-2 text-[0.75rem] text-red-500 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
