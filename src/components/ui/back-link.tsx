import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

/** Bouton retour visible, posé en tête de chaque sous-page. */
export function BackLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border border-border bg-hairline px-4 text-[0.8125rem] font-medium text-body transition-colors hover:border-border-strong hover:text-fg",
        className,
      )}
    >
      <Icon
        path={icons.arrowRight}
        className="h-4 w-4 rotate-180 rtl:rotate-0"
        strokeWidth={2}
      />
      {label}
    </Link>
  );
}
