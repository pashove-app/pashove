import Link from "next/link";
import type { Merchant } from "@/components/dashboard/types";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { initialsOf } from "@/lib/initials";

/** Carte du marchand, en haut de la navigation. */
export function SidebarProfileCard({
  t,
  locale,
  merchant,
  collapsed = false,
}: {
  t: Dictionary;
  locale: Locale;
  merchant: Merchant;
  collapsed?: boolean;
}) {
  const avatar = (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[0.6875rem] font-semibold tracking-[0.02em] text-white">
      {initialsOf(merchant.name)}
    </span>
  );

  if (collapsed) {
    return (
      <Link
        href={path(locale, "/app/settings")}
        title={merchant.name}
        aria-label={t.dashboard.sidebar.profileCta}
        className="flex justify-center rounded-xl p-1.5 transition-colors hover:bg-white/[0.07]"
      >
        {avatar}
      </Link>
    );
  }

  return (
    <Link
      href={path(locale, "/app/settings")}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-2.5",
        "transition-colors hover:bg-white/[0.1]",
      )}
    >
      {avatar}
      <span className="min-w-0">
        <span className="block truncate text-[0.8125rem] font-medium text-white">
          {merchant.name}
        </span>
        <span className="block truncate text-[0.6875rem] text-white/50">
          {t.dashboard.sidebar.profileCta}
        </span>
      </span>
    </Link>
  );
}
