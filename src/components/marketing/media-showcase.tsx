"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, icons } from "@/components/ui/primitives";

/** Aperçu produit réel + lecteur vidéo de démonstration. */
export function PublicMediaShowcase({
  poster,
  video,
  domain,
  title,
  caption,
}: {
  poster: string;
  video: string;
  domain: string;
  title: string;
  caption: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_35px_90px_-40px_rgba(10,14,26,0.65)] sm:p-3">
        <div className="flex items-center gap-2 border-b border-slate-200 px-2 pb-2.5 pt-1">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B6B]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FFD166]/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#4ADE80]/80" />
          </span>
          <span className="mx-auto flex h-6 w-[58%] max-w-64 items-center justify-center rounded-full bg-slate-100 text-[0.5625rem] text-slate-400">
            {domain}
          </span>
          <span className="h-5 w-5 rounded-full bg-slate-100" />
        </div>

        <div className="relative mt-2 overflow-hidden rounded-[1rem] bg-[#0A0E1A]">
          <video
            className="aspect-video w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={poster}
            src={video}
            aria-label={title}
          />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={title}
            className="absolute inset-0 flex items-center justify-center bg-[#05070D]/15 transition-colors hover:bg-[#05070D]/30"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/90 text-[#0A0E1A] shadow-2xl transition-transform hover:scale-105">
              <Icon path={icons.play} className="ms-0.5 h-6 w-6" />
            </span>
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-[#05070D]/85 to-transparent p-4">
            <span>
              <span className="block text-[0.5625rem] font-semibold uppercase tracking-[0.15em] text-brand-200">
                Démo Pashove
              </span>
              <span className="mt-0.5 block text-[0.75rem] font-medium text-white">
                {title}
              </span>
            </span>
            <span className="rounded-full border border-white/20 bg-black/30 px-2 py-1 text-[0.5625rem] text-white/70">
              {caption}
            </span>
          </div>
        </div>
      </div>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
              <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <p className="text-[0.8125rem] font-medium text-white">{title}</p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Fermer la vidéo"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    <Icon path={icons.close} className="h-5 w-5" strokeWidth={2} />
                  </button>
                </div>
                <video
                  className="aspect-video w-full bg-black"
                  src={video}
                  poster={poster}
                  controls
                  autoPlay
                  playsInline
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
