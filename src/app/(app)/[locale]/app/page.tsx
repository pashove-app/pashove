import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import { currentStore } from "@/lib/stores/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Espace marchand",
  robots: { index: false, follow: false },
};

/**
 * Accueil du dashboard.
 *
 * En attendant les cartes d'action du prochain lot, il résume la boutique et
 * mène aux deux écrans réellement disponibles : les réglages et la sécurité.
 */
export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ published?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const { published } = await searchParams;

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const t = await getDictionary(locale);

  return (
    <div className="mx-auto w-full max-w-4xl">
      {published ? (
        <div
          role="status"
          className="mb-8 flex animate-rise items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-4 motion-reduce:animate-none"
        >
          <Icon
            path={icons.check}
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300"
            strokeWidth={2.4}
          />
          <div>
            <p className="text-[0.875rem] font-medium text-emerald-700 dark:text-emerald-300">
              {t.onboarding.launchPublished}
            </p>
            <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted">
              {t.onboarding.launchPublishedText}
            </p>
          </div>
        </div>
      ) : null}

      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {t.auth.workspaceTitle}
      </span>

      <h1 className="mt-4 text-[1.9rem] font-medium tracking-[-0.03em] text-fg sm:text-[2.4rem]">
        {store.name}
      </h1>

      <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
        {t.auth.workspaceText}
      </p>

      <dl className="mt-10 max-w-lg divide-y divide-border rounded-2xl border border-border bg-surface">
        <Row label={t.auth.workspaceSignedInAs} value={user?.email ?? "—"} />
        <Row label={t.onboarding.slugLabel} value={store.slug} mono />
        <Row
          label={t.onboarding.countryLabel}
          value={
            t.countries_names[store.country as keyof Dictionary["countries_names"]] ??
            store.country
          }
        />
        <Row label={t.onboarding.currencyLabel} value={store.currency} mono />
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href={path(locale, "/app/settings/store")} variant="outline">
          <Icon path={icons.store} className="h-4 w-4" />
          {t.settings.storeTitle}
        </ButtonLink>

        <ButtonLink href={path(locale, "/auth/security")} variant="outline">
          <Icon path={icons.shield} className="h-4 w-4" />
          {t.auth.securityTitle}
        </ButtonLink>
      </div>

      <p className="mt-8 flex items-start gap-2.5 text-[0.8125rem] text-subtle">
        <Icon path={icons.shield} className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        {t.footer.secureLine}
      </p>
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
