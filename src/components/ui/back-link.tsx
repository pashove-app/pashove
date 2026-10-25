import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

/** Lien retour discret, posé en tête de chaque sous-page. */
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
        "inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:underline",
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
