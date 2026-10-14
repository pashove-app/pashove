import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PashoveLogo } from "@/components/brand/pashove-logo";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonClass, Icon, icons } from "@/components/ui/primitives";
import { signOutAction } from "@/lib/auth/actions";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { LOCALES, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "Espace marchand",
  robots: { index: false, follow: false },
};

/**
 * Première page protégée de la plateforme.
 *
 * Son rôle pour l'instant : prouver que l'authentification fonctionne de bout
 * en bout — session lue côté serveur, redirection si absente, déconnexion
 * réelle. Le tableau de bord complet viendra s'installer ici.
 */
export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  if (!isSupabaseConfigured()) redirect(`/${locale}/auth/login`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const t = await getDictionary(locale);
  const storeName =
    (user.user_metadata?.store_name as string | undefined) ?? "—";

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-5 sm:px-8">
          <PashoveLogo />
          <div className="flex items-center gap-2">
            <LocaleSwitcher
              locale={locale}
              labels={{ label: t.header.languageLabel, current: t.header.currentLanguage }}
            />
            <ThemeToggle
              labels={{ toLight: t.header.themeToLight, toDark: t.header.themeToDark }}
            />
            <form action={signOutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className={buttonClass({ variant: "outline", size: "sm" })}
              >
                {t.auth.workspaceSignOut}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {t.auth.workspaceTitle}
        </span>

        <h1 className="text-[1.9rem] font-medium tracking-[-0.03em] text-fg sm:text-[2.4rem]">
          {storeName}
        </h1>

        <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
          {t.auth.workspaceText}
        </p>

        <dl className="mt-10 max-w-lg divide-y divide-border rounded-2xl border border-border bg-surface">
          <Row label={t.auth.workspaceSignedInAs} value={user.email ?? "—"} />
          <Row label={t.auth.email} value={user.id} mono />
          <Row
            label={t.auth.country}
            value={
              (user.user_metadata?.country as string | undefined) ?? "—"
            }
          />
        </dl>

        <p className="mt-8 flex items-start gap-2.5 text-[0.8125rem] text-subtle">
          <Icon path={icons.shield} className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          {t.footer.secureLine}
        </p>
      </main>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <dt className="text-[0.8125rem] text-subtle">{label}</dt>
      <dd
        dir="ltr"
        className={
          mono
            ? "min-w-0 truncate font-mono text-[0.75rem] text-body"
            : "min-w-0 truncate text-[0.8125rem] text-body"
        }
      >
        {value}
      </dd>
    </div>
  );
}
