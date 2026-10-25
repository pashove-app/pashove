"use client";

import { useEffect, useState } from "react";
import { Icon, icons } from "@/components/ui/primitives";

export type KycDocument = { label: string; url: string | null };

/** Documents KYC privés, ouverts dans une modale avec fermeture explicite. */
export function KycDocumentViewer({
  documents,
}: {
  documents: KycDocument[];
}) {
  const [open, setOpen] = useState<KycDocument | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };

    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {documents.map((document) => (
          <div key={document.label}>
            <p className="mb-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-faint">
              {document.label}
            </p>
            {document.url ? (
              <button
                type="button"
                onClick={() => setOpen(document)}
                className="group relative block w-full overflow-hidden rounded-2xl border border-border transition-colors hover:border-brand-500"
              >
                {/* Lien signé de courte durée, jamais public. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={document.url}
                  alt={document.label}
                  className="h-44 w-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-black/55 px-3 py-2 text-[0.6875rem] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Cliquer pour agrandir
                </span>
              </button>
            ) : (
              <div className="flex h-44 items-center justify-center rounded-2xl border border-dashed border-border text-[0.75rem] text-faint">
                Non fourni
              </div>
            )}
          </div>
        ))}
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.label}
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Fermer"
            className="absolute end-4 top-4 inline-flex h-10 items-center gap-2 rounded-full bg-white/15 px-4 text-[0.75rem] font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25 sm:end-6 sm:top-6"
          >
            <Icon path={icons.close} className="h-4 w-4" strokeWidth={2.2} />
            Fermer
          </button>

          <div
            className="max-h-[85vh] max-w-[92vw] overflow-hidden rounded-3xl bg-black"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={open.url ?? ""}
              alt={open.label}
              className="max-h-[80vh] max-w-[90vw] object-contain"
            />
            <p className="px-4 py-3 text-center text-[0.75rem] text-white/70">
              {open.label}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
