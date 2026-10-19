"use client";

import { useId, useRef, useState } from "react";
import { buttonClass, Icon, icons, Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { uploadWithPresign, fileContentType } from "@/lib/media/upload-client";
import { FILE_EXTENSIONS, MAX_FILE_BYTES } from "@/lib/r2/media";

export type FileValue = { id: string; name: string | null } | null;

export type FileUploaderLabels = {
  choose: string;
  replace: string;
  remove: string;
  uploading: string;
  errorType: string;
  errorSize: string;
  errorUpload: string;
};

const ACCEPT = ".pdf,.zip,.epub,.mp3,application/pdf,application/zip,application/epub+zip,audio/mpeg";

/**
 * Téléverseur de fichier vendu.
 *
 * Le fichier part vers le bucket privé : aucune adresse publique n'est jamais
 * produite. La base ne garde qu'un identifiant de média et le nom d'origine.
 */
export function FileUploader({
  name,
  label,
  help,
  initial,
  labels,
}: {
  name: string;
  label: string;
  help: string;
  initial: FileValue;
  labels: FileUploaderLabels;
}) {
  const [file, setFile] = useState<FileValue>(initial);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  async function handleFile(selected: File) {
    setError(null);

    if (!(fileContentType(selected) in FILE_EXTENSIONS)) {
      setError(labels.errorType);
      return;
    }

    if (selected.size > MAX_FILE_BYTES) {
      setError(labels.errorSize);
      return;
    }

    setBusy(true);
    setProgress(0);

    try {
      const saved = await uploadWithPresign(selected, "digital_file", setProgress);
      setFile({ id: saved.id, name: saved.name ?? selected.name });
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

        {file ? (
          <button
            type="button"
            onClick={() => setFile(null)}
            className="text-[0.75rem] font-medium text-subtle transition-colors hover:text-fg"
          >
            {labels.remove}
          </button>
        ) : null}
      </div>

      <p className="mt-0.5 text-[0.75rem] text-subtle">{help}</p>

      <div className="mt-2">
        {file ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/[0.12] text-accent">
              <Icon path={icons.download} className="h-4 w-4" strokeWidth={1.8} />
            </span>

            <p className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-fg">
              {file.name ?? "—"}
            </p>

            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className={buttonClass({ variant: "outline", size: "sm" })}
            >
              {labels.replace}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface/60",
              "px-4 py-6 text-[0.8125rem] font-medium text-body transition-colors hover:border-border-strong",
            )}
          >
            {busy ? <Spinner /> : <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.2} />}
            {labels.choose}
          </button>
        )}
      </div>

      {busy ? (
        <p className="mt-2 flex items-center gap-2 text-[0.75rem] text-subtle">
          <Spinner />
          {labels.uploading} {progress} %
        </p>
      ) : null}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) void handleFile(selected);
          event.currentTarget.value = "";
        }}
      />

      <input type="hidden" name={name} value={file?.id ?? ""} />

      {error ? (
        <p role="alert" className="mt-2 text-[0.75rem] text-red-500 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
