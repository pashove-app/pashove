import type { Metadata } from "next";
import Link from "next/link";
import { Icon, icons, buttonClass } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getDictionary(locale);
  return { title: t.auth.lockedTitle };
}

/**
 * Compte verrouillé.
 *
 * Page d'information pure, sans données ni session : elle sert de destination
 * le jour où le moteur de risque suspendra un compte. Rien ne pointe encore
 * vers elle, faute de mécanisme de suspension — c'est volontaire, et non un
 * oubli.
 */
export default async function AccountLockedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return (
    <div className="text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-600 dark:text-amber-300">
        <Icon path={icons.lock} className="h-6 w-6" />
      </span>

      <h1 className="mt-6 text-[1.6rem] font-medium tracking-[-0.03em] text-fg">
        {t.auth.lockedTitle}
      </h1>

      <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
        {t.auth.lockedText}
      </p>

      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
        {t.auth.lockedHelp}
      </p>

      <a
        href="mailto:support@pashove.com"
        className={buttonClass({ size: "lg", className: "mt-8 w-full" })}
      >
        <Icon path={icons.chat} className="h-4 w-4" />
        {t.auth.lockedContact}
      </a>

      <Link
        href={path(locale, "/auth/login")}
        className="mt-6 inline-block text-[0.875rem] font-medium text-accent transition-colors hover:text-accent-soft"
      >
        {t.auth.switchToLogin}
      </Link>
    </div>
  );
}
