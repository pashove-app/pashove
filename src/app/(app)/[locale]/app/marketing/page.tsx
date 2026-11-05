import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CampaignForm } from "@/components/dashboard/campaign-form";
import { Icon, icons } from "@/components/ui/primitives";
import { resolveLocale } from "@/i18n/config";
import { getStoreAnalytics } from "@/lib/analytics/queries";
import { listCampaigns } from "@/lib/marketing/campaigns";
import { formatMoney } from "@/lib/money";
import { currentStore } from "@/lib/stores/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function MarketingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const [analytics, campaigns] = await Promise.all([
    getStoreAnalytics(store.id),
    listCampaigns(store.id),
  ]);

  const supabase = await createClient();
  const { count: reminders } = await supabase
    .from("cart_reminders")
    .select("id", { count: "exact", head: true })
    .eq("store_id", store.id)
    .eq("status", "pending");

  const money = (amount: number) =>
    formatMoney(amount, store.currency, "fr-FR");

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
            Croissance
          </p>
          <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.035em] text-fg sm:text-[2.125rem]">
            Marketing
          </h1>
          <p className="mt-1.5 max-w-xl text-[0.875rem] leading-relaxed text-subtle">
            Parle à tes clients, récupère les paniers abandonnés et suis ce qui
            fonctionne.
          </p>
        </div>
        <Link
          href={`/${locale}/app/analytics`}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-[0.8125rem] font-medium text-body hover:border-border-strong"
        >
          <Icon path={icons.chart} className="h-4 w-4" strokeWidth={1.8} />
          Analyses complètes
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <MiniStat
          label="Chiffre d’affaires · 30 j"
          value={analytics ? money(analytics.revenue) : "—"}
        />
        <MiniStat
          label="Clients"
          value={analytics ? String(analytics.newCustomers) : "—"}
          hint="nouveaux sur 30 jours"
        />
        <MiniStat
          label="Paniers à relancer"
          value={String(reminders ?? 0)}
          hint="opt-in, après 24 h"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_1fr]">
        <CampaignForm locale={locale} />

        <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[0.9375rem] font-medium text-fg">
              Campagnes
            </h2>
            <span className="text-[0.6875rem] text-faint">
              {campaigns.length}
            </span>
          </div>

          {campaigns.length === 0 ? (
            <p className="mt-4 text-[0.8125rem] leading-relaxed text-subtle">
              Aucune campagne envoyée. Ta première campagne apparaîtra ici.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-hairline">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-fg">
                      {campaign.subject}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[0.625rem] ${
                        campaign.status === "sent"
                          ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                          : campaign.status === "sending"
                            ? "bg-amber-500/12 text-amber-600 dark:text-amber-400"
                            : "bg-hairline text-subtle"
                      }`}
                    >
                      {campaign.status === "sent"
                        ? "Envoyée"
                        : campaign.status === "sending"
                          ? "En cours"
                          : campaign.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[0.6875rem] text-subtle">
                    {campaign.segment === "all"
                      ? "Tous les contacts"
                      : campaign.segment === "digital"
                        ? "Acheteurs numériques"
                        : "Clients payants"}{" "}
                    · {campaign.sent_count}/{campaign.recipient_count} envoyés ·{" "}
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "medium",
                    }).format(new Date(campaign.created_at))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-5 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/[0.12] text-accent">
            <Icon path={icons.mail} className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="text-[0.9375rem] font-medium text-fg">
              Panier abandonné
            </h2>
            <p className="mt-1 max-w-2xl text-[0.8125rem] leading-relaxed text-subtle">
              Le client peut laisser son e-mail depuis son panier. Si le panier
              reste inactif plus de 24 h, un rappel unique lui est envoyé avec
              un lien qui le rouvre. Aucun e-mail n’est envoyé sans opt-in.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-[0.6875rem] text-subtle">{label}</p>
      <p className="mt-1 truncate text-[1.125rem] font-semibold tabular-nums text-fg">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[0.625rem] text-faint">{hint}</p> : null}
    </div>
  );
}
