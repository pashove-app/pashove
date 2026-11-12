import type { Metadata } from "next";
import { Icon, icons } from "@/components/ui/primitives";
import {
  createDeliveryPartnerAction,
  settlePartnerPayoutAction,
} from "@/lib/delivery-partners/actions";
import { getPlatformMarkets } from "@/lib/markets/queries";
import { formatMoney } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pashove · Livreurs partenaires",
  robots: { index: false, follow: false },
};

const STATUS_LABELS: Record<string, string> = {
  invited: "Invité",
  active: "Actif",
  suspended: "Suspendu",
};

export default async function DeliveryPartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const supabase = await createClient();
  const [partnersResult, driversResult, markets, payoutsResult] = await Promise.all([
    supabase
      .from("delivery_partners")
      .select("id, company_name, email, phone, country, status, commission_bps, invite_token, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("partner_drivers")
      .select("id, partner_id, status"),
    getPlatformMarkets(),
    supabase
      .from("partner_payouts")
      .select("id, amount, created_at, partner:delivery_partners(company_name)")
      .eq("status", "requested")
      .order("created_at", { ascending: true }),
  ]);

  const partners = partnersResult.data ?? [];
  const driverCounts = new Map<string, number>();
  for (const driver of driversResult.data ?? []) {
    driverCounts.set(
      driver.partner_id,
      (driverCounts.get(driver.partner_id) ?? 0) + 1,
    );
  }
  const enabledMarkets = markets.filter((market) => market.isEnabled);
  const payouts = payoutsResult.data ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
          Logistique
        </p>
        <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          Livreurs partenaires
        </h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
          Des entreprises de livraison avec leur propre flotte. Pashove fixe le
          prix des courses et prélève sa commission ; le partenaire gère ses
          livreurs et son solde.
        </p>
      </header>

      {ok ? (
        <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-3 text-[0.8125rem] text-emerald-700 dark:text-emerald-300">
          Partenaire créé et invitation envoyée.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3.5 py-3 text-[0.8125rem] text-red-600 dark:text-red-400">
          Impossible de créer le partenaire. Vérifie l’e-mail et le pays.
        </p>
      ) : null}

      <section className="mt-6 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">
          Créer un partenaire
        </h2>
        <p className="mt-1 text-[0.75rem] text-subtle">
          Un lien d’accès est envoyé à l’entreprise pour créer son mot de passe.
        </p>

        <form
          action={createDeliveryPartnerAction}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          <label className="text-[0.75rem] font-medium text-body">
            Entreprise
            <input
              name="companyName"
              required
              maxLength={120}
              placeholder="Accra Express"
              className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg"
            />
          </label>
          <label className="text-[0.75rem] font-medium text-body">
            E-mail de connexion
            <input
              name="email"
              type="email"
              required
              placeholder="contact@transporteur.com"
              className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg"
            />
          </label>
          <label className="text-[0.75rem] font-medium text-body">
            Téléphone
            <input
              name="phone"
              type="tel"
              maxLength={40}
              placeholder="+223 70 00 00 00"
              className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg"
            />
          </label>
          <label className="text-[0.75rem] font-medium text-body">
            Pays d’opération
            <select
              name="country"
              required
              className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg"
            >
              {enabledMarkets.map((market) => (
                <option key={market.code} value={market.countryCode}>
                  {market.countryName} ({market.countryCode})
                </option>
              ))}
            </select>
          </label>
          <label className="text-[0.75rem] font-medium text-body">
            Commission Pashove sur la course (%)
            <input
              name="commissionPercent"
              type="number"
              min={0}
              max={100}
              step={1}
              defaultValue={10}
              className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-500 px-5 text-[0.8125rem] font-medium text-white hover:bg-brand-600"
            >
              <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
              Créer et envoyer l’invitation
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[0.9375rem] font-medium text-fg">
            Versements demandés
          </h2>
          <span className="text-[0.6875rem] text-faint">{payouts.length}</span>
        </div>

        {payouts.length === 0 ? (
          <p className="mt-4 text-[0.8125rem] text-subtle">
            Aucun versement en attente.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-hairline">
            {payouts.map((payout) => {
              const partner = payout.partner as
                | { company_name?: string }
                | null;
              return (
                <div
                  key={payout.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-[0.8125rem] font-medium text-fg">
                      {partner?.company_name ?? "Partenaire"}
                    </p>
                    <p className="text-[0.6875rem] text-faint">
                      {formatMoney(payout.amount, "XOF", "fr-FR")} ·{" "}
                      {new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "medium",
                      }).format(new Date(payout.created_at))}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={settlePartnerPayoutAction}>
                      <input type="hidden" name="payoutId" value={payout.id} />
                      <input type="hidden" name="status" value="paid" />
                      <button
                        type="submit"
                        className="h-8 rounded-full bg-emerald-500/10 px-3 text-[0.6875rem] font-medium text-emerald-700 dark:text-emerald-300"
                      >
                        Marquer payé
                      </button>
                    </form>
                    <form action={settlePartnerPayoutAction}>
                      <input type="hidden" name="payoutId" value={payout.id} />
                      <input type="hidden" name="status" value="rejected" />
                      <button
                        type="submit"
                        className="h-8 rounded-full border border-border px-3 text-[0.6875rem] text-subtle"
                      >
                        Refuser
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[0.9375rem] font-medium text-fg">Partenaires</h2>
          <span className="text-[0.6875rem] text-faint">{partners.length}</span>
        </div>

        {partners.length === 0 ? (
          <p className="mt-4 text-[0.8125rem] text-subtle">
            Aucun partenaire pour l’instant.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-hairline">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="flex flex-wrap items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[0.8125rem] font-medium text-fg">
                      {partner.company_name}
                    </p>
                    <span className="rounded-full bg-hairline px-2 py-0.5 text-[0.625rem] text-subtle">
                      {STATUS_LABELS[partner.status] ?? partner.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[0.6875rem] text-faint">
                    {partner.email} · {partner.country} ·{" "}
                    {partner.commission_bps / 100} % plateforme ·{" "}
                    {driverCounts.get(partner.id) ?? 0} livreur(s)
                  </p>
                  {partner.status === "invited" ? (
                    <p className="mt-1 break-all font-mono text-[0.625rem] text-brand-600 dark:text-brand-300">
                      /fr/partner/delivery/join?token={partner.invite_token}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
