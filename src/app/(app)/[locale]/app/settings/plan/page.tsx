import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PlanUpgradeForm } from "@/components/app/plan-upgrade-form";
import { BackLink } from "@/components/ui/back-link";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCurrentPlan } from "@/lib/plans/queries";
import { currentStore } from "@/lib/stores/queries";
import { isGatewayNetwork } from "@/lib/payments/catalog";
import { listPayinRates } from "@/lib/payments/saspay/client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.settings.title };
}

export default async function PlanSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const [plan, rates] = await Promise.all([
    getCurrentPlan(),
    listPayinRates().catch(() => []),
  ]);

  const networks = rates
    .filter(
      (rate) =>
        rate.country_code?.toUpperCase() === store.country.toUpperCase() &&
        rate.payin?.available !== false &&
        !isGatewayNetwork(rate.network_code),
    )
    .map((rate) => ({ code: rate.network_code, name: rate.network_name }));

  const current = plan?.code ?? "free";
  const expires = plan?.expiresAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
        new Date(plan.expiresAt),
      )
    : null;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <BackLink href={path(locale, "/app/settings")} label="Retour aux réglages" />

      <h1 className="mt-5 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        Abonnement
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">
        Ton plan actuel et le renouvellement de {store.name}.
      </p>

      <section className="mt-6 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-faint">
              Plan actuel
            </p>
            <p className="mt-1 text-[1.5rem] font-medium text-fg">
              {plan?.name ?? "Free"}
            </p>
          </div>
          <div className="text-end">
            <p className="text-[0.8125rem] text-subtle">
              {plan?.feeIncluded
                ? "Frais SasPay inclus"
                : "Frais SasPay séparés"}
            </p>
            {expires ? (
              <p className="text-[0.8125rem] font-medium text-fg">
                Jusqu’au {expires}
              </p>
            ) : (
              <p className="text-[0.8125rem] text-subtle">Sans expiration</p>
            )}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-hairline pt-4 text-[0.8125rem] sm:grid-cols-4">
          <div>
            <dt className="text-subtle">Commission</dt>
            <dd className="font-medium text-fg">
              {(plan?.commissionBps ?? 1000) / 100} %
            </dd>
          </div>
          <div>
            <dt className="text-subtle">Boutiques</dt>
            <dd className="font-medium text-fg">{plan?.maxStores ?? 2}</dd>
          </div>
          <div>
            <dt className="text-subtle">Membres</dt>
            <dd className="font-medium text-fg">{plan?.maxMembers ?? 5}</dd>
          </div>
          <div>
            <dt className="text-subtle">Prix</dt>
            <dd className="font-medium text-fg">
              {plan?.priceAmount ?? 0} {plan?.currency ?? "XOF"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">
          {current === "free" ? "Passer à un plan payant" : "Renouveler"}
        </h2>
        <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
          Paiement Mobile Money via SasPay. Activation immédiate après
          confirmation du webhook.
        </p>

        <div className="mt-4">
          <PlanUpgradeForm
            locale={locale}
            networks={networks}
            currentPlan={current}
            disabledReason={
              store.currency.toUpperCase() !== "XOF"
                ? "Le prix des plans est en XOF. La conversion FX des abonnements n’est pas encore active pour une boutique en " +
                  store.currency +
                  "."
                : undefined
            }
          />
        </div>
      </section>
    </div>
  );
}
