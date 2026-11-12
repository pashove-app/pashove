import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon, icons } from "@/components/ui/primitives";
import {
  addPartnerDriverAction,
  requestPartnerPayoutAction,
} from "@/lib/delivery-partners/actions";
import { formatMoney } from "@/lib/money";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Espace livreur partenaire",
  robots: { index: false, follow: false },
};

type Driver = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  compensationType: string;
  commissionBps: number;
  salaryAmount: number;
};

type Dashboard = {
  partner: {
    id: string;
    companyName: string;
    email: string;
    phone: string | null;
    country: string;
    commissionBps: number;
    status: string;
  };
  balance: { balance: number; earned: number; paid: number };
  drivers: Driver[];
  stats: { deliveries: number; gross: number; driverCommissions: number };
  payouts: {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    paidAt: string | null;
  }[];
};

const DRIVER_STATUS: Record<string, string> = {
  invited: "Invité",
  active: "Actif",
  suspended: "Suspendu",
};

const PAYOUT_STATUS: Record<string, string> = {
  requested: "Demandé",
  paid: "Payé",
  rejected: "Refusé",
};

export default async function PartnerDeliveryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { ok, error } = await searchParams;

  if (!isSupabaseConfigured()) redirect(`/${locale}/auth/login`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login?redirect=%2Fpartner%2Fdelivery`);
  }

  const { data, error: dashboardError } = await supabase.rpc(
    "partner_dashboard",
  );

  if (dashboardError || !data) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4">
        <div className="rounded-3xl border border-border bg-surface p-6 text-center">
          <p className="text-[1.125rem] font-medium text-fg">
            Espace partenaire indisponible
          </p>
          <p className="mt-2 text-[0.875rem] text-subtle">
            Ce compte n’est pas encore rattaché à une entreprise de livraison
            active. Contacte Pashove.
          </p>
          <Link
            href={`/${locale}/auth/login`}
            className="mt-4 inline-flex h-10 items-center rounded-full border border-border px-4 text-[0.8125rem] font-medium text-body"
          >
            Se connecter
          </Link>
        </div>
      </main>
    );
  }

  const dashboard = data as Dashboard;
  const money = (amount: number) => formatMoney(amount, "XOF", "fr-FR");

  return (
    <main className="min-h-screen bg-bg px-4 py-8 text-fg sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
              Livraison partenaire
            </p>
            <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em]">
              {dashboard.partner.companyName}
            </h1>
            <p className="mt-1 text-[0.8125rem] text-subtle">
              {dashboard.partner.country} ·{" "}
              {dashboard.partner.commissionBps / 100} % de commission Pashove ·
              solde {money(dashboard.balance.balance)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/app/courier`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-[0.75rem] font-medium text-subtle hover:text-fg"
            >
              <Icon path={icons.route} className="h-3.5 w-3.5" strokeWidth={1.8} />
              Espace livreur
            </Link>
            <Link
              href={`/${locale}/auth/logout`}
              className="inline-flex h-9 items-center rounded-full border border-border px-4 text-[0.75rem] font-medium text-subtle hover:text-fg"
            >
              Déconnexion
            </Link>
          </div>
        </header>

        {ok ? (
          <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-3 text-[0.8125rem] text-emerald-700 dark:text-emerald-300">
            {ok === "driver"
              ? "Livreur ajouté et invitation envoyée."
              : "Demande de versement enregistrée."}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3.5 py-3 text-[0.8125rem] text-red-600 dark:text-red-400">
            Opération impossible. Vérifie les informations et réessaie.
          </p>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Solde disponible", money(dashboard.balance.balance)],
            ["Total gagné", money(dashboard.balance.earned)],
            ["Courses livrées", String(dashboard.stats.deliveries)],
            ["Commissions livreurs", money(dashboard.stats.driverCommissions)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
                {label}
              </p>
              <p className="mt-1.5 text-[1.15rem] font-medium text-fg">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_1fr]">
          <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-[0.9375rem] font-medium text-fg">
              Ajouter un livreur
            </h2>
            <p className="mt-1 text-[0.75rem] text-subtle">
              Le livreur reçoit un code d’invitation par e-mail.
            </p>

            <form action={addPartnerDriverAction} className="mt-4 space-y-3">
              <label className="block text-[0.75rem] font-medium text-body">
                Nom complet
                <input
                  name="name"
                  required
                  maxLength={120}
                  className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-[0.75rem] font-medium text-body">
                  E-mail
                  <input
                    name="email"
                    type="email"
                    required
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg"
                  />
                </label>
                <label className="block text-[0.75rem] font-medium text-body">
                  Téléphone
                  <input
                    name="phone"
                    type="tel"
                    required
                    maxLength={40}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg"
                  />
                </label>
              </div>
              <label className="block text-[0.75rem] font-medium text-body">
                Rémunération
                <select
                  name="compensationType"
                  className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg"
                >
                  <option value="commission">Commission sur la course</option>
                  <option value="salary">Salaire mensuel</option>
                  <option value="both">Commission + salaire</option>
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-[0.75rem] font-medium text-body">
                  Commission livreur (%)
                  <input
                    name="commissionPercent"
                    type="number"
                    min={0}
                    max={90}
                    step={1}
                    defaultValue={5}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg"
                  />
                </label>
                <label className="block text-[0.75rem] font-medium text-body">
                  Salaire mensuel (FCFA)
                  <input
                    name="salaryAmount"
                    type="number"
                    min={0}
                    step={500}
                    defaultValue={0}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-500 px-5 text-[0.8125rem] font-medium text-white hover:bg-brand-600"
              >
                <Icon path={icons.plus} className="h-4 w-4" strokeWidth={2.4} />
                Ajouter et inviter
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-[0.9375rem] font-medium text-fg">
              Demander un versement
            </h2>
            <p className="mt-1 text-[0.75rem] text-subtle">
              Le montant est réservé sur ton solde jusqu’au traitement.
            </p>
            <form action={requestPartnerPayoutAction} className="mt-4 flex items-end gap-2">
              <label className="min-w-0 flex-1 text-[0.75rem] font-medium text-body">
                Montant
                <input
                  name="amount"
                  type="number"
                  min={1}
                  step={500}
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-[0.8125rem] text-fg"
                />
              </label>
              <button
                type="submit"
                className="h-10 rounded-full border border-border px-4 text-[0.8125rem] font-medium text-body hover:border-border-strong"
              >
                Demander
              </button>
            </form>

            <h3 className="mt-6 text-[0.8125rem] font-medium text-fg">
              Derniers versements
            </h3>
            {dashboard.payouts.length === 0 ? (
              <p className="mt-2 text-[0.75rem] text-subtle">Aucun versement.</p>
            ) : (
              <ul className="mt-2 divide-y divide-hairline">
                {dashboard.payouts.slice(0, 5).map((payout) => (
                  <li
                    key={payout.id}
                    className="flex items-center justify-between gap-3 py-2 text-[0.75rem]"
                  >
                    <span className="text-body">{money(payout.amount)}</span>
                    <span className="text-faint">
                      {PAYOUT_STATUS[payout.status] ?? payout.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[0.9375rem] font-medium text-fg">Mes livreurs</h2>
            <span className="text-[0.6875rem] text-faint">
              {dashboard.drivers.length}
            </span>
          </div>

          {dashboard.drivers.length === 0 ? (
            <p className="mt-4 text-[0.8125rem] text-subtle">
              Aucun livreur. Ajoute ton premier livreur ci-dessus.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-hairline">
              {dashboard.drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-[0.8125rem] font-medium text-fg">
                      {driver.name}
                    </p>
                    <p className="mt-0.5 text-[0.6875rem] text-faint">
                      {driver.phone} · {driver.email}
                    </p>
                  </div>
                  <div className="text-right text-[0.6875rem]">
                    <p className="text-subtle">
                      {DRIVER_STATUS[driver.status] ?? driver.status}
                    </p>
                    <p className="text-faint">
                      {driver.compensationType === "salary"
                        ? `Salaire ${money(driver.salaryAmount)}`
                        : `${driver.commissionBps / 100} % par course`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
