import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Emplacement média de la vitrine.
 *
 * ── Comment brancher tes médias ────────────────────────────────────────
 * 1. Dépose tes fichiers dans `public/media/` (le dossier existe déjà).
 * 2. Renseigne le chemin dans la section concernée :
 *
 *      <MediaSlot src="/media/hero.mp4" poster="/media/hero.jpg" />
 *
 * Formats conseillés : MP4 (H.264), ≤ 8 Mo, 1920×1080, 8 à 14 s, sans son.
 * ───────────────────────────────────────────────────────────────────────
 *
 * Le décor animé est **toujours** rendu en couche de fond ; la vidéo vient
 * simplement se peindre par-dessus quand elle est disponible. Conséquence :
 * un emplacement sans source (ou dont le fichier manque) affiche un visuel
 * soigné au lieu d'un trou — sans requête réseau, donc sans 404.
 */
export function MediaSlot({
  src,
  poster,
  className,
  frameClassName,
  overlay = true,
  fill = false,
  children,
}: {
  /** Chemin public de la vidéo, ex. `/media/hero.mp4`. */
  src?: string;
  /** Image d'attente affichée avant lecture, ex. `/media/hero.jpg`. */
  poster?: string;
  className?: string;
  frameClassName?: string;
  /** Aplat dégradé pour garder le texte lisible par-dessus. */
  overlay?: boolean;
  /** Remplit son conteneur en position absolue (héro, clôture). */
  fill?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "media-frame grain",
        fill && "media-frame--fill",
        frameClassName,
        className,
      )}
    >
      <div className="media-layer">{children ?? <GeneratedBackdrop />}</div>

      {src ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : null}

      {overlay ? <div className="scrim" /> : null}
    </div>
  );
}

/**
 * Décor animé : dégradé profond, deux halos qui dérivent lentement,
 * un balayage lumineux en rotation et une grille discrète.
 * Aucun média requis, tout en CSS, et se fige si les animations sont réduites.
 */
/** Teintes du décor généré — chaque diapositive du héro en utilise une. */
const TONES = {
  blue: { sky: "#12327d", mid: "#0a1a44", halo: "bg-brand-600", edge: "bg-brand-400" },
  teal: { sky: "#0d4f63", mid: "#062433", halo: "bg-teal-500", edge: "bg-cyan-400" },
  indigo: { sky: "#2a1f78", mid: "#120b3c", halo: "bg-indigo-500", edge: "bg-indigo-400" },
  violet: { sky: "#421c72", mid: "#1d0b39", halo: "bg-violet-500", edge: "bg-fuchsia-400" },
} as const;

export type BackdropTone = keyof typeof TONES;

export function GeneratedBackdrop({
  className,
  intensity = "normal",
  tone = "blue",
}: {
  className?: string;
  intensity?: "normal" | "soft";
  tone?: BackdropTone;
}) {
  const soft = intensity === "soft";
  const palette = TONES[tone];

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {/* Ciel profond : plus lumineux vers le bas, comme un horizon */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(125% 105% at 50% 118%, ${palette.sky} 0%, ${palette.mid} 34%, #050d20 66%, #03060e 100%)`,
        }}
      />

      {/* Grille technique */}
      <div className="absolute inset-0 bg-grid opacity-25" />

      {/* Champ d'étoiles */}
      <div className="starfield absolute inset-0 opacity-70 motion-reduce:animate-none" />

      {/* Halo d'horizon */}
      <div
        className={cn(
          "absolute left-1/2 top-[58%] h-[46rem] w-[46rem] -translate-x-1/2 rounded-full blur-[130px]",
          palette.halo,
          soft ? "opacity-20" : "opacity-35",
          "animate-drift motion-reduce:animate-none",
        )}
      />

      {/* Deux halos périphériques qui dérivent en sens inverse */}
      <div
        className={cn(
          "absolute -left-[16%] top-[-18%] h-[38rem] w-[38rem] rounded-full blur-[110px]",
          palette.edge,
          soft ? "opacity-10" : "opacity-20",
          "animate-drift motion-reduce:animate-none",
        )}
      />
      <div
        className={cn(
          "absolute -right-[12%] bottom-[-22%] h-[34rem] w-[34rem] rounded-full bg-brand-700 blur-[120px]",
          soft ? "opacity-15" : "opacity-30",
          "animate-drift motion-reduce:animate-none [animation-delay:-9s]",
        )}
      />

      {/* Arc d'horizon, comme la courbure d'une planète */}
      <div className="absolute left-1/2 top-[86%] h-[120rem] w-[120rem] -translate-x-1/2 rounded-full border border-brand-400/25" />
      <div className="absolute left-1/2 top-[92%] h-[120rem] w-[120rem] -translate-x-1/2 rounded-full border border-brand-400/12" />

      {/* Balayage lumineux en rotation */}
      <div className="absolute inset-0 animate-orbit opacity-30 motion-reduce:animate-none [background:conic-gradient(from_0deg,transparent_0deg,color-mix(in_oklab,var(--color-brand-300)_26%,transparent)_34deg,transparent_92deg)]" />

      {/* Vignette : concentre le regard au centre */}
      <div className="absolute inset-0 shadow-[inset_0_0_160px_50px_rgba(0,0,0,0.65)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
}

/**
 * Carte vidéo flottante — la vignette qui accompagne le défilement.
 * Même logique de repli que `MediaSlot`.
 */
export function FloatingVideoCard({
  label,
  caption,
  src,
  poster,
  className,
}: {
  label: string;
  caption: string;
  src?: string;
  poster?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group w-[15.5rem] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_30px_80px_-30px_rgba(0,0,0,0.75)]",
        className,
      )}
    >
      <div className="relative aspect-video overflow-hidden">
        <GeneratedBackdrop intensity="soft" />

        {src ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={poster}
            aria-hidden="true"
            tabIndex={-1}
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={src} type="video/mp4" />
          </video>
        ) : null}

        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink-950 shadow-lg transition-transform duration-300 group-hover:scale-110">
            <svg viewBox="0 0 12 12" className="h-3 w-3 fill-current" aria-hidden="true">
              <path d="M3.5 1.5 10 6l-6.5 4.5v-9Z" />
            </svg>
          </span>
        </span>
      </div>

      <div className="px-3.5 py-3">
        <p className="text-[0.8125rem] font-medium leading-snug text-fg">{label}</p>
        <p className="mt-0.5 text-[0.6875rem] leading-snug text-subtle">{caption}</p>
      </div>
    </div>
  );
}
