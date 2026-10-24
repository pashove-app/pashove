"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { uploadWithPresign } from "@/lib/media/upload-client";
import { MAX_IMAGE_BYTES } from "@/lib/r2/media";

/** Champs de libellé communs aux couvertures (collection, paquet). */
export type CoverLabels = {
  coverLabel: string;
  coverHelp: string;
  coverAdd: string;
  coverReplace: string;
  coverRemove: string;
  uploading: string;
  coverErrorType: string;
  coverErrorSize: string;
  coverErrorUpload: string;
};

export type CoverImage = { id: string; url: string } | null;

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Image de couverture : une seule, avec aperçu et remplacement. */
export function CoverImageField({
  labels,
  value,
  onChange,
  error,
}: {
  labels: CoverLabels;
  value: CoverImage;
  onChange: (next: CoverImage) => void;
  error?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  async function handleFile(file: File) {
    setLocalError(null);

    if (!ACCEPTED.includes(file.type)) {
      setLocalError(labels.coverErrorType);
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setLocalError(labels.coverErrorSize);
      return;
    }

    setBusy(true);
    setProgress(0);

    try {
      const saved = await uploadWithPresign(file, "banner", setProgress);
      if (saved.url) onChange({ id: saved.id, url: saved.url });
    } catch {
      setLocalError(labels.coverErrorUpload);
    } finally {
      setBusy(false);
    }
  }

  const message = localError ?? error;

  return (
    <div>
      <label htmlFor={inputId} className="block text-[0.8125rem] font-medium text-body">
        {labels.coverLabel}
      </label>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handleFile(file);
        }}
      />

      {value ? (
        <div className="relative mt-2 aspect-[16/9] max-h-52 w-full overflow-hidden rounded-xl border border-border bg-hairline">
          <Image
            src={value.url}
            alt=""
            fill
            loading="eager"
            sizes="(max-width: 1024px) 100vw, 640px"
            className="object-cover"
          />

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-white/15 px-2.5 py-1.5 text-[0.75rem] font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              {busy ? labels.uploading : labels.coverReplace}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => onChange(null)}
              className="rounded-lg bg-white/15 px-2.5 py-1.5 text-[0.75rem] font-medium text-white backdrop-blur-sm transition-colors hover:bg-red-500/70"
            >
              {labels.coverRemove}
            </button>
          </div>

          {busy ? (
            <span className="absolute end-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[0.6875rem] font-medium text-white backdrop-blur-sm">
              <Spinner className="h-3 w-3" />
              {Math.round(progress)} %
            </span>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-2 flex aspect-[16/9] max-h-52 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-faint transition-colors hover:border-border-strong hover:text-subtle disabled:opacity-60"
        >
          {busy ? <Spinner /> : <Icon path={icons.plus} className="h-5 w-5" strokeWidth={1.8} />}
          <span className="text-[0.8125rem] font-medium">
            {busy ? `${labels.uploading} ${Math.round(progress)} %` : labels.coverAdd}
          </span>
        </button>
      )}

      {message ? (
        <p role="alert" className="mt-2 text-[0.75rem] text-red-500 dark:text-red-400">
          {message}
        </p>
      ) : (
        <p className="mt-2 text-[0.75rem] text-subtle">{labels.coverHelp}</p>
      )}
    </div>
  );
}
