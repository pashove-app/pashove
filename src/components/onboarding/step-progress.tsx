import { cn } from "@/lib/cn";

/**
 * Progression d'un parcours en plusieurs étapes.
 *
 * Des barres plutôt que des cercles numérotés : à quatre étapes, le nombre
 * importe moins que la distance parcourue. Le libellé porte l'information
 * accessible — les barres elles-mêmes sont décoratives.
 */
export function StepProgress({
  current,
  total,
  label,
}: {
  /** Étape en cours, à partir de 1. */
  current: number;
  total: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-1 w-9 rounded-full",
              index < current ? "bg-brand-500" : "bg-hairline-strong",
            )}
          />
        ))}
      </div>

      <p className="text-xs font-medium tabular-nums text-subtle">{label}</p>
    </div>
  );
}
