import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Largeur de lecture de la vitrine, plus généreuse que l'espace marchand. */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}
