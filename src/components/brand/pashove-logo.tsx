import { cn } from "@/lib/cn";

/**
 * Marque Pashove.
 *
 * Un double chevron ascendant : la valeur qui monte, posée sur une base.
 * Deux traits seulement, joints arrondis, dessinés sur une grille de 40 pour
 * rester nets jusqu'à 16 px. Le glyphe hérite de la couleur du parent, donc il
 * fonctionne sur fond clair comme sur fond sombre sans variante dédiée.
 */
export function PashoveMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
      className={cn("h-8 w-8 shrink-0", className)}
    >
      <path
        d="M10.5 19.5 20 10l9.5 9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 28 20 21.5 26.5 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Monogramme seul — favicons, avatars, espaces étroits. */
export function PashoveMonogram({ className }: { className?: string }) {
  return <PashoveMark className={className} />;
}

/**
 * Logo complet : glyphe + nom.
 * Le mot hérite de la couleur du parent, donc il reste juste dans les deux thèmes.
 */
export function PashoveLogo({
  className,
  markClassName,
  wordClassName,
  showMark = true,
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
  showMark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {showMark ? <PashoveMark className={cn("h-7 w-7", markClassName)} /> : null}
      <span
        className={cn(
          "text-[1.45rem] font-medium leading-none tracking-[-0.035em]",
          wordClassName,
        )}
      >
        pashove
        <span className="sr-only">, la plateforme e-commerce africaine</span>
      </span>
    </span>
  );
}

/** Version empilée, pour les clôtures de page et les contextes carrés. */
export function PashoveLockup({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex flex-col items-center gap-3", className)}>
      <PashoveMark className="h-11 w-11" />
      <span className="text-lg font-medium leading-none tracking-[-0.035em]">
        pashove
      </span>
    </span>
  );
}

/** Glyphe monochrome, quand la couleur est déjà portée par le parent. */
export function PashoveGlyph({ className }: { className?: string }) {
  return <PashoveMark className={cn("h-5 w-5", className)} />;
}
