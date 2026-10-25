import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { acceptInvitationAction } from "@/lib/team/actions";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.team.acceptTitle };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Acceptation d'une invitation d'équipe. */
export default async function AcceptInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const { token: rawToken, error: rawError } = await searchParams;

  const t = await getDictionary(locale);
  const labels = t.dashboard.team;
  const token = typeof rawToken === "string" ? rawToken : "";

  if (!UUID_PATTERN.test(token)) redirect(`/${locale}/app`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const errorMessage =
    rawError === "wrongEmail"
      ? labels.wrongEmail
      : rawError === "invalidInvitation"
        ? labels.invalidInvitation
        : null;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/[0.12] text-accent">
          <Icon path={icons.users} className="h-5 w-5" strokeWidth={1.8} />
        </span>

        <h1 className="mt-5 text-[1.5rem] font-medium tracking-[-0.03em] text-fg">
          {labels.acceptTitle}
        </h1>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">
          {labels.acceptSubtitle}
        </p>

        {errorMessage ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-red-600 dark:text-red-400"
          >
            {errorMessage}
          </p>
        ) : null}

        {!user ? (
          <div className="mt-5">
            <p className="rounded-xl border border-border bg-hairline/40 px-3 py-2.5 text-[0.75rem] leading-relaxed text-subtle">
              {labels.loginToAccept}
            </p>
            <Link
              href={path(locale, "/auth/login")}
              className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-brand-500 text-[0.875rem] font-medium text-white transition-colors hover:bg-brand-600"
            >
              {t.auth.loginTitle}
            </Link>
          </div>
        ) : (
          <form action={acceptInvitationAction} className="mt-5">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-500 text-[0.875rem] font-medium text-white transition-colors hover:bg-brand-600"
            >
              <Icon path={icons.check} className="h-4 w-4" strokeWidth={2.4} />
              {labels.accept}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
