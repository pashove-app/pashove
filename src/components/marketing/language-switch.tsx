"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

const COOKIE = "pashove_locale";

function persistLocale(next: "fr" | "en") {
  document.cookie = `${COOKIE}=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

export function PublicLanguageSwitch({ locale }: { locale: "fr" | "en" }) {
  const pathname = usePathname();
  const router = useRouter();

  function change(next: "fr" | "en") {
    if (next === locale) return;
    persistLocale(next);
    const parts = pathname.split("/");
    if (parts[1] === "fr" || parts[1] === "en") {
      parts[1] = next;
    } else {
      parts.splice(1, 0, next);
    }
    router.push(parts.join("/") || `/${next}`);
  }

  return (
    <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
      {(["fr", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => change(code)}
          className={cn(
            "rounded-full px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] transition-colors",
            locale === code
              ? "bg-brand-500 text-white"
              : "text-white/40 hover:text-white",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
