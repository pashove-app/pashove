import type { ReactNode } from "react";

/** Bandeau de l'administration, aligné sur l'accueil marchand. */
export function AdminHero({
  title = "Administration Pashove",
  subtitle,
  children,
}: {
  title?: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] ring-1 ring-white/10">
      <div
        aria-hidden="true"
        className="absolute inset-0 [background:radial-gradient(120%_140%_at_10%_-10%,#7b9cff_0%,transparent_52%),linear-gradient(115deg,#3c63ff_0%,#2243f0_42%,#121f9c_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06),transparent_45%)]"
      />

      <svg
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        focusable="false"
        className="absolute -end-5 top-1/2 w-40 -translate-y-1/2 text-white/[0.12] sm:w-56"
      >
        <path
          d="M10.5 19.5 20 10l9.5 9.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.5 28 20 21.5 26.5 28"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-9">
        <div className="min-w-0">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-white/60">
            Pashove · Interne
          </p>
          <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-[2.25rem]">
            {title}
          </h1>
          <p className="mt-2 max-w-xl text-[0.875rem] leading-relaxed text-white/75 sm:text-[0.9375rem]">
            {subtitle}
          </p>
        </div>

        {children ? (
          <div className="flex flex-col gap-2.5 sm:items-end">{children}</div>
        ) : null}
      </div>
    </section>
  );
}
