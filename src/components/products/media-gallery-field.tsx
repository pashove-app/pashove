"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { uploadWithPresign } from "@/lib/media/upload-client";
import { MAX_IMAGE_BYTES } from "@/lib/r2/media";

export type GalleryItem = { id: string; url: string };

export type GalleryLabels = {
  add: string;
  remove: string;
  makePrimary: string;
  primary: string;
  uploading: string;
  errorType: string;
  errorSize: string;
  errorUpload: string;
};

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_IMAGES = 4;

/**
 * Galerie de quatre images.
 *
 * La première est l'image principale. L'ordre du tableau est l'ordre
 * d'enregistrement : chaque image devient un champ caché portant son
 * identifiant de média.
 */
export function MediaGalleryField({
  name,
  label,
  help,
  initial,
  labels,
}: {
  name: string;
  label: string;
  help: string;
  initial: GalleryItem[];
  labels: GalleryLabels;
}) {
  const [images, setImages] = useState<GalleryItem[]>(initial.slice(0, MAX_IMAGES));
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
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
      const saved = await uploadWithPresign(file, "product", setProgress);
      if (saved.url) {
        setImages((current) =>
          [...current, { id: saved.id, url: saved.url as string }].slice(
            0,
            MAX_IMAGES,
          ),
        );
      }
    } catch {
      setError(labels.errorUpload);
    } finally {
      setBusy(false);
    }
  }

  function makePrimary(index: number) {
    setImages((current) => {
      const next = [...current];
      const [picked] = next.splice(index, 1);
      return [picked, ...next];
    });
  }

  return (
    <div>
      <label htmlFor={inputId} className="text-[0.8125rem] font-medium text-body">
        {label}
      </label>
      <p className="mt-0.5 text-[0.75rem] text-subtle">{help}</p>

      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-hairline"
          >
            <Image
              src={image.url}
              alt=""
              fill
              sizes="(max-width: 640px) 45vw, 160px"
              className="object-cover"
            />

            {index === 0 ? (
              <span className="absolute start-2 top-2 rounded-full bg-brand-500 px-2 py-0.5 text-[0.625rem] font-semibold text-white">
                {labels.primary}
              </span>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/55 p-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              {index > 0 ? (
                <button
                  type="button"
                  onClick={() => makePrimary(index)}
                  aria-label={labels.makePrimary}
                  title={labels.makePrimary}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <Icon path={icons.arrowUp} className="h-4 w-4" strokeWidth={2} />
                </button>
              ) : (
                <span />
              )}

              <button
                type="button"
                onClick={() =>
                  setImages((current) =>
                    current.filter((entry) => entry.id !== image.id),
                  )
                }
                aria-label={labels.remove}
                title={labels.remove}
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              >
                <Icon path={icons.close} className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}

        {images.length < MAX_IMAGES ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border",
              "bg-surface/60 text-faint transition-colors hover:border-border-strong",
            )}
          >
            {busy ? <Spinner /> : <Icon path={icons.plus} className="h-5 w-5" strokeWidth={2} />}
            <span className="px-2 text-center text-[0.6875rem]">
              {busy ? `${labels.uploading} ${progress} %` : labels.add}
            </span>
          </button>
        ) : null}
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

      {images.map((image) => (
        <input key={image.id} type="hidden" name={name} value={image.id} />
      ))}

      {error ? (
        <p role="alert" className="mt-2 text-[0.75rem] text-red-500 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
