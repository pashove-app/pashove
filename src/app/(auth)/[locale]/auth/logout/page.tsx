import type { Metadata } from "next";
import Link from "next/link";
import { Icon, icons, buttonClass } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { signOutAction } from "@/lib/auth/actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getDictionary(locale);
  return { title: t.auth.logoutTitle };
}

/**
 * Écran de déconnexion.
 *
 * Il existe pour offrir une adresse stable où atterrir, et surtout pour que la
 * sortie passe par un POST : une déconnexion déclenchée par un simple GET
 * pourrait être provoquée par n'importe quelle balise d'une page tierce.
 */
export default async function LogoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return (
    <div className="text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border-strong bg-hairline text-muted">
        <Icon path={icons.lock} className="h-6 w-6" />
      </span>

      <h1 className="mt-6 text-[1.6rem] font-medium tracking-[-0.03em] text-fg">
        {t.auth.logoutTitle}
      </h1>

      <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
        {t.auth.logoutText}
      </p>

      <form action={signOutAction} className="mt-8">
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          className={buttonClass({ size: "lg", className: "w-full" })}
        >
          {t.auth.workspaceSignOut}
        </button>
      </form>

      <Link
        href={path(locale, "/app")}
        className="mt-6 inline-block text-[0.875rem] font-medium text-accent transition-colors hover:text-accent-soft"
      >
        {t.auth.logoutStay}
      </Link>
    </div>
  );
}
