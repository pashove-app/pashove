import Link from "next/link";
import type { ReactNode } from "react";
import { RevealLines } from "@/components/ui/motion";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ *
 *  Conteneurs
 * ------------------------------------------------------------------ */

export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

export function Section({
  id,
  className,
  children,
  bleed = false,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  bleed?: boolean;
}) {
  return (
    <section
      id={id}
      // `overflow-x-clip` (et non `hidden`) : contient les halos décoratifs
      // sans créer de conteneur de défilement, donc sans casser `sticky`.
      className={cn("relative overflow-x-clip py-20 sm:py-24 lg:py-32", className)}
    >
      {bleed ? children : <Container>{children}</Container>}
    </section>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border-soft bg-hairline px-3.5 py-1.5",
        "text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent-strong",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  titleLines,
  description,
  align = "left",
  className,
  titleClassName,
}: {
  eyebrow?: ReactNode;
  /** Titre d'un seul bloc, révélé d'un coup. */
  title?: ReactNode;
  /** Titre découpé en lignes, chacune se levant derrière un masque. */
  titleLines?: ReactNode[];
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
}) {
  const headingClassName = cn(
    "mt-5 max-w-3xl text-[2rem] font-light leading-[1.06] tracking-[-0.04em] text-fg sm:text-[2.6rem] lg:text-[3.25rem]",
    titleClassName,
  );

  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}

      {titleLines ? (
        <RevealLines as="h2" lines={titleLines} className={headingClassName} />
      ) : (
        <h2 className={headingClassName}>{title}</h2>
      )}

      {description ? (
        <p
          className={cn(
            "mt-5 max-w-2xl text-[0.975rem] leading-relaxed text-muted sm:text-base",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Boutons
 * ------------------------------------------------------------------ */

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50";

const BUTTON_SIZES = {
  sm: "h-9 px-4 text-[0.8125rem]",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-7 text-[0.9375rem]",
  xl: "h-14 px-8 text-base",
} as const;

const BUTTON_VARIANTS = {
  primary:
    "bg-brand-500 text-on-accent shadow-[0_10px_30px_-10px_rgba(47,92,255,0.75)] hover:bg-brand-400 hover:shadow-[0_14px_40px_-12px_rgba(47,92,255,0.9)] active:scale-[0.985]",
  outline:
    "border border-border-soft bg-hairline text-fg hover:border-border-strong hover:bg-hairline-strong",
  ghost: "text-muted hover:bg-hairline hover:text-fg",
  /** Pilule blanche pleine, posée sur un média sombre (héro). */
  light:
    "bg-white text-ink-950 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] hover:bg-white/90 active:scale-[0.985]",
} as const;

type ButtonVariant = keyof typeof BUTTON_VARIANTS;
type ButtonSize = keyof typeof BUTTON_SIZES;

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(BUTTON_BASE, BUTTON_SIZES[size], BUTTON_VARIANTS[variant], className);
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  // Les destinations (/auth/*, /docs…) ne sont pas encore construites :
  // le préchargement déclencherait un 404. À repasser à `true` au fur et à mesure.
  prefetch = false,
  ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  const external = href.startsWith("http") || href.startsWith("mailto:");

  if (external) {
    return (
      <a
        href={href}
        className={buttonClass({ variant, size, className })}
        rel="noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={buttonClass({ variant, size, className })}
      {...rest}
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ *
 *  Cartes
 * ------------------------------------------------------------------ */

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border bg-surface p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FeatureIcon({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border-soft bg-gradient-to-b from-hairline to-transparent text-accent",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 *  Icônes (traits, 24×24)
 * ------------------------------------------------------------------ */

/**
 * Isole une valeur chiffrée du sens de lecture ambiant.
 * Sans cela, en arabe, « +25 000 » s'affiche « 000 25+ » et « 50+ » devient « +50 ».
 */
export function Num({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span dir="ltr" className={cn("unicode-bidi-isolate", className)}>
      {children}
    </span>
  );
}

export function Icon({
  path,
  className,
  strokeWidth = 1.6,
}: {
  path: ReactNode;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
    >
      {path}
    </svg>
  );
}

export const icons = {
  check: <path d="m4.5 12.5 5 5 10-11" />,
  bolt: <path d="M13.5 2 4 13.5h6L10.5 22 20 10.5h-6L13.5 2Z" />,
  shield: (
    <>
      <path d="M12 2.5 4.5 5.6v5.9c0 4.6 3.1 8.5 7.5 9.9 4.4-1.4 7.5-5.3 7.5-9.9V5.6L12 2.5Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="18" cy="18" r="2.2" />
      <path d="M8.2 6h5.3a3.5 3.5 0 0 1 0 7h-3a3.5 3.5 0 0 0 0 7h5.3" />
    </>
  ),
  bag: (
    <>
      <path d="M5.5 7.5h13l-1.3 12a2.4 2.4 0 0 1-2.4 2.1H9.2a2.4 2.4 0 0 1-2.4-2.1L5.5 7.5Z" />
      <path d="M9 7.5V6a3 3 0 0 1 6 0v1.5" />
    </>
  ),
  box: (
    <>
      <path d="M20.5 8.2v7.6a1.6 1.6 0 0 1-.84 1.4l-6.9 3.7a1.6 1.6 0 0 1-1.52 0l-6.9-3.7a1.6 1.6 0 0 1-.84-1.4V8.2" />
      <path d="m3.5 8.2 8.5-4.6 8.5 4.6-8.5 4.6-8.5-4.6Z" />
      <path d="M12 12.8V21" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.5v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4.5 19.5h15" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8.5 3v4M15.5 3v4" />
    </>
  ),
  gift: (
    <>
      <path d="M3.5 11.5h17V19a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-7.5Z" />
      <path d="M3 7.5h18v4H3zM12 7.5V21" />
      <path d="M12 7.5S10.5 3 8 3a2.3 2.3 0 0 0 0 4.5h4Zm0 0S13.5 3 16 3a2.3 2.3 0 0 1 0 4.5h-4Z" />
    </>
  ),
  users: (
    <>
      <circle cx="9.5" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5" />
      <path d="M16.5 5.2a3.2 3.2 0 0 1 0 6.1M18 14.9c1.8.7 3 2.4 3 4.4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 20v-6M12.5 20V8M17 20v-9" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.2 2.4 3.4 5.4 3.4 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.4-5.4-3.4-8.5S9.8 5.9 12 3.5Z" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <path d="M12 14.5v2" />
    </>
  ),
  code: (
    <>
      <path d="m9 8-4.5 4L9 16" />
      <path d="m15 8 4.5 4L15 16" />
    </>
  ),
  webhook: (
    <>
      <path d="M9.5 6.5a3 3 0 1 1 5 2.2l2.6 4.4" />
      <path d="M6 16.5h5.2L8.6 21" />
      <circle cx="17.5" cy="17" r="3" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-.9 2-1.9 0-1.4-1.4-1.7-1.4-2.9 0-.9.8-1.6 1.9-1.6h1.6a4.4 4.4 0 0 0 4.4-4.4c0-3.4-3.8-6.2-8.5-6.2Z" />
      <path d="M8 10.5h.01M11.5 8h.01M15.5 9.5h.01" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="12" r="3.5" />
      <path d="M11.5 12h9M17.5 12v3.2M20.5 12v2.2" />
    </>
  ),
  arrowRight: <path d="M4.5 12h14m-5.5-5.5L18.5 12 13 17.5" />,
  arrowUpRight: <path d="M7 17 17 7M8.5 7H17v8.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  percent: (
    <>
      <path d="M19 5 5 19" />
      <circle cx="7.5" cy="7.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </>
  ),
  chat: (
    <>
      <path d="M4.5 5.5h15a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H9l-4.5 3.5v-3.5a1.5 1.5 0 0 1-1.5-1.5V7a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m15.5 15.5 4 4" />
    </>
  ),
  sparkle: (
    <path d="M12 3.5 13.9 9.4 19.8 11.3 13.9 13.2 12 19.1 10.1 13.2 4.2 11.3 10.1 9.4 12 3.5Z" />
  ),
  arrowUp: <path d="M12 19V5m-6 6 6-6 6 6" />,
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="m4 7.5 8 5.5 8-5.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  store: (
    <>
      <path d="M3.5 9.5 5.3 4.5h13.4l1.8 5" />
      <path d="M4.5 9.5h15V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V9.5Z" />
      <path d="M9.5 20.5V14h5v6.5" />
    </>
  ),
  phone: (
    <path d="M6.6 3.5h2.9l1.5 3.9-2 1.5a12.4 12.4 0 0 0 5.6 5.6l1.5-2 3.9 1.5v2.9a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" />
  ),
  tag: (
    <>
      <path d="M3.5 11.2V4.5a1 1 0 0 1 1-1h6.7a1 1 0 0 1 .7.3l8.3 8.3a1 1 0 0 1 0 1.4l-6.7 6.7a1 1 0 0 1-1.4 0L3.8 11.9a1 1 0 0 1-.3-.7Z" />
      <circle cx="7.6" cy="7.6" r="1.2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M4 4.5 20 19.5" />
      <path d="M9.6 6.2A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.2 17.2 0 0 1-3.5 4.3" />
      <path d="M6.4 8.3A17.5 17.5 0 0 0 2.5 12S6 18.5 12 18.5c1 0 1.9-.2 2.8-.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
  wallet: (
    <>
      <path d="M3.5 8.5A2.5 2.5 0 0 1 6 6h11a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 17 20H6a2.5 2.5 0 0 1-2.5-2.5v-9Z" />
      <path d="M19.5 10.5h-3a2 2 0 0 0 0 4h3" />
    </>
  ),
  bell: (
    <>
      <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5s1.5-1.5 1.5-5.5Z" />
      <path d="M10 18.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  globe2: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
    </>
  ),
} as const;

export type IconKey = keyof typeof icons;
