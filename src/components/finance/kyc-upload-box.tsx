"use client";

import { useRef, useState } from "react";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { uploadWithPresign } from "@/lib/media/upload-client";
import { MAX_IMAGE_BYTES } from "@/lib/r2/media";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export type KycUploadLabels = {
  add: string;
  replace: string;
  remove: string;
  uploading: string;
  errorType: string;
  errorSize: string;
  errorUpload: string;
};

/** Un document KYC : envoi privé, aperçu local uniquement. */
export function KycUploadBox({
  label,
  help,
  value,
  onChange,
  labels,
  error,
}: {
  label: string;
  help: string;
  value: string;
  onChange: (next: string) => void;
  labels: KycUploadLabels;
  error?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLocalError(null);

    if (!ACCEPTED.includes(file.type)) {
      setLocalError(labels.errorType);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setLocalError(labels.errorSize);
      return;
    }

    setBusy(true);
    setProgress(0);

    try {
      const saved = await uploadWithPresign(file, "kyc_document", setProgress);
      onChange(saved.id);
      setPreview(URL.createObjectURL(file));
    } catch {
      setLocalError(labels.errorUpload);
    } finally {
      setBusy(false);
    }
  }

  const message = localError ?? error;

  return (
    <div>
      <p className="text-[0.8125rem] font-medium text-body">{label}</p>
      <p className="mt-0.5 text-[0.75rem] text-subtle">{help}</p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handleFile(file);
        }}
      />

      {value && preview ? (
        <div className="relative mt-2 h-40 w-full overflow-hidden rounded-2xl border border-border bg-hairline">
          {/* Aperçu local uniquement : l'objet reste dans le bucket privé. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="rounded-full bg-white/15 px-3 py-1.5 text-[0.6875rem] font-medium text-white backdrop-blur-sm hover:bg-white/25"
            >
              {busy ? labels.uploading : labels.replace}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                onChange("");
                setPreview(null);
              }}
              className="rounded-full bg-white/15 px-3 py-1.5 text-[0.6875rem] font-medium text-white backdrop-blur-sm hover:bg-red-500/70"
            >
              {labels.remove}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-2 flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-faint transition-colors hover:border-border-strong hover:text-subtle disabled:opacity-60"
        >
          {busy ? <Spinner /> : <Icon path={icons.plus} className="h-5 w-5" strokeWidth={1.8} />}
          <span className="text-[0.75rem] font-medium">
            {busy ? `${labels.uploading} ${Math.round(progress)} %` : labels.add}
          </span>
        </button>
      )}

      {message ? (
        <p role="alert" className="mt-2 text-[0.75rem] text-red-500 dark:text-red-400">
          {message}
        </p>
      ) : null}
    </div>
  );
}
