import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StoreCreateForm } from "@/components/dashboard/store-create-form";
import { BackLink } from "@/components/ui/back-link";
import { ButtonLink } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  canManageTeam,
  currentMembership,
  listStoreMemberships,
} from "@/lib/stores/queries";
import { readAccountPlan } from "@/lib/team/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.stores.createTitle };
}

/** Création d'une boutique supplémentaire (limite du plan vérifiée en base). */
export default async function NewStorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);
  const labels = t.dashboard.stores;

  if (!canManageTeam(membership.role)) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <BackLink href={path(locale, "/app")} label={labels.backToApp} />
        <p className="mt-6 rounded-3xl border border-border bg-surface p-6 text-[0.875rem] text-muted">
          {labels.accessDenied}
        </p>
      </div>
    );
  }

  const [memberships, plan] = await Promise.all([
    listStoreMemberships(),
    readAccountPlan(),
  ]);

  const owned = memberships.filter((entry) => entry.role === "owner").length;
  const limitReached = owned >= plan.max_stores;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href={path(locale, "/app")} label={labels.backToApp} />

      <div className="mt-4">
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {labels.createTitle}
        </h1>
        <p className="mt-1 max-w-xl text-[0.875rem] leading-relaxed text-muted">
          {labels.createSubtitle}
        </p>
      </div>

      <p className="mt-4 inline-flex rounded-full bg-hairline px-3 py-1.5 text-[0.75rem] font-medium text-subtle">
        {labels.planUsage
          .replace("{used}", String(owned))
          .replace("{max}", String(plan.max_stores))
          .replace("{plan}", plan.name)}
      </p>

      <div className="mt-6">
        {limitReached ? (
          <div className="rounded-3xl border border-amber-400/25 bg-amber-400/[0.06] p-6">
            <h2 className="text-[0.9375rem] font-medium text-fg">
              {labels.limitTitle}
            </h2>
            <p className="mt-1.5 text-[0.8375rem] leading-relaxed text-muted">
              {labels.limitText.replace("{max}", String(plan.max_stores))}
            </p>
            <ButtonLink
              href={path(locale, "/app")}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              {labels.backToApp}
            </ButtonLink>
          </div>
        ) : (
          <StoreCreateForm t={t} locale={locale} />
        )}
      </div>
    </div>
  );
}
