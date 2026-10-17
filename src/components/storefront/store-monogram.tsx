import { BRAND_GRADIENT } from "@/components/storefront/brand";
import { cn } from "@/lib/cn";

/** « Maison Kora » → « MK ». Une seule initiale si le nom n'a qu'un mot. */
export function initialsOf(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
    .toUpperCase();

  return initials || "P";
}

/**
 * Logo de repli : les initiales sur l'aplat de marque.
 *
 * Il tient la place du logo jusqu'à ce que les médias soient branchés, et
 * reste lisible à toutes les tailles.
 */
export function StoreMonogram({
  name,
  size = "lg",
}: {
  name: string;
  size?: "sm" | "lg";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden text-white",
        size === "lg" ? "h-16 w-16 rounded-2xl text-xl" : "h-10 w-10 rounded-xl text-sm",
      )}
    >
      <span className={cn("absolute inset-0", BRAND_GRADIENT)} />
      <span className="relative font-semibold tracking-[0.02em]">{initialsOf(name)}</span>
    </span>
  );
}
