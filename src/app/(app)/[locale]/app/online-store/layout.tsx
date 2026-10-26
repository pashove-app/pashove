import type { ReactNode } from "react";
import Link from "next/link";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/** Sous-navigation de la boutique en ligne. */
export default async function OnlineStoreLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);
  const labels = t.dashboard.theme;

  const tabs = [
    {
      href: path(locale, "/app/online-store/themes"),
      label: labels.library,
    },
    {
      href: path(locale, "/app/online-store/editor"),
      label: labels.editor,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <nav className="mb-6 flex gap-2 border-b border-border pb-3">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-full border border-border px-4 py-2 text-[0.75rem] font-medium text-subtle transition-colors hover:border-border-strong hover:text-fg"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
