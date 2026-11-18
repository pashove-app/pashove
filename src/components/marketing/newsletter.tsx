"use client";

import { useState } from "react";
import { Icon, icons } from "@/components/ui/primitives";
import type { SiteContent } from "@/lib/marketing/content";

type State = "idle" | "loading" | "success" | "error";

export function NewsletterForm({
  content,
}: {
  content: SiteContent["newsletter"];
}) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [state, setState] = useState<State>("idle");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === "loading") return;
    setState("loading");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, company, source: "site-public" }),
      });
      if (!response.ok) throw new Error("subscribe_failed");
      setState("success");
      setEmail("");
    } catch {
      setState("error");
    }
  };

  return (
    <section className="bg-[#FAFAFA] px-3 pb-14 pt-4 sm:px-5 sm:pb-18 sm:pt-6">
      <div className="mx-auto grid w-full max-w-7xl gap-8 rounded-[2rem] bg-[#0A0E1A] px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div>
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-brand-300">
            {content.eyebrow}
          </p>
          <h2 className="font-display mt-3 text-[clamp(1.6rem,3vw,2.5rem)] leading-[1.08] tracking-[-0.03em] text-white">
            {content.title}
          </h2>
          <p className="mt-2 max-w-xl text-[0.8125rem] leading-relaxed text-white/45">
            {content.description}
          </p>
        </div>

        <form onSubmit={submit} className="w-full">
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className="hidden"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              {content.placeholder}
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (state !== "idle") setState("idle");
              }}
              placeholder={content.placeholder}
              className="h-12 min-w-0 flex-1 rounded-full border border-white/15 bg-white/[0.05] px-5 text-[0.8125rem] text-white placeholder:text-white/30 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-[0.8125rem] font-semibold text-white shadow-[0_16px_35px_-14px_rgba(47,92,255,0.8)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
            >
              {state === "loading" ? content.loading : content.cta}
              <Icon path={icons.arrowRight} className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
          <p
            aria-live="polite"
            className={
              state === "success"
                ? "mt-2 min-h-4 text-[0.6875rem] font-medium text-emerald-300"
                : state === "error"
                  ? "mt-2 min-h-4 text-[0.6875rem] font-medium text-red-300"
                  : "mt-2 min-h-4 text-[0.6875rem] leading-relaxed text-white/35"
            }
          >
            {state === "success"
              ? content.success
              : state === "error"
                ? content.error
                : content.note}
          </p>
        </form>
      </div>
    </section>
  );
}
