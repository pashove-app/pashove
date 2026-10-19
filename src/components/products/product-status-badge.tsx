import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";

export function ProductStatusBadge({
  t,
  status,
}: {
  t: Dictionary;
  status: "draft" | "published";
}) {
  const published = status === "published";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium",
        published
          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300"
          : "border-border-soft bg-hairline text-subtle",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          published ? "bg-emerald-400" : "bg-faint",
        )}
      />
      {published
        ? t.dashboard.products.statusPublished
        : t.dashboard.products.statusDraft}
    </span>
  );
}
