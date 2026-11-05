import Link from "next/link";
import { AdminHero } from "@/components/platform/admin-hero";
import { ButtonLink, Icon, icons, type IconKey } from "@/components/ui/primitives";
import { getAdminDashboard } from "@/lib/platform/admin-queries";
import { formatMoney } from "@/lib/money";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminOverviewPage() {
  const data = await getAdminDashboard();

  if (!data) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-8">
        <p className="text-[0.9375rem] font-medium text-fg">
          Tableau de bord indisponible
        </p>
        <p className="mt-2 text-[0.8125rem] text-subtle">
          Ton rôle ne permet pas de lire les indicateurs, ou la base n’est pas
          accessible.
        </p>
      </div>
    );
  }

  const max = Math.max(...data.series.map((point) => point.amount), 1);

  const cards: {
    href: string;
    icon: IconKey;
    label: string;
    value: string;
    detail: string;
  }[] = [
    {
      href: "/platform-admin/merchants",
      icon: "users",
      label: "GMV · 30 jours",
      value: formatMoney(data.gmv30, "XOF", "fr-FR"),
      detail: `${data.orders30} commande${data.orders30 === 1 ? "" : "s"} payée${data.orders30 === 1 ? "" : "s"}`,
    },
    {
      href: "/platform-admin/reconciliation",
      icon: "wallet",
      label: "Commissions en créance",
      value: formatMoney(data.commissionDue, "XOF", "fr-FR"),
      detail: "Solde ledger des commissions",
    },
    {
      href: "/platform-admin/merchants",
      icon: "store",
      label: "Marchands actifs",
      value: String(data.activeMerchants),
      detail: `${data.activeStores} boutique${data.activeStores === 1 ? "" : "s"} active${data.activeStores === 1 ? "" : "s"}`,
    },
    {
      href: "/platform-admin/users",
      icon: "chart",
      label: "Comptes",
      value: String(data.customers),
      detail: `${data.totalStores} boutique${data.totalStores === 1 ? "" : "s"} au total`,
    },
  ];

  return (
    <div>
      <AdminHero subtitle="Les indicateurs de la plateforme, les alertes opérationnelles et les marchands qui font Pashove.">
        <ButtonLink href="/platform-admin/merchants" variant="light" size="pill">
          <Icon path={icons.users} className="h-4 w-4" strokeWidth={1.8} />
          Voir les marchands
        </ButtonLink>
        <ButtonLink href="/platform-admin/settings" variant="light" size="pill">
          <Icon path={icons.settings} className="h-4 w-4" strokeWidth={1.8} />
          Réglages
        </ButtonLink>
      </AdminHero>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-3xl border border-border bg-surface p-5 transition-all hover:border-border-strong"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/[0.12] text-accent">
              <Icon path={icons[card.icon]} className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} />
            </span>
            <p className="mt-5 text-[0.75rem] text-subtle">{card.label}</p>
            <p className="mt-1.5 truncate text-[1.5rem] font-semibold tabular-nums tracking-[-0.04em] text-fg">
              {card.value}
            </p>
            <p className="mt-1 text-[0.6875rem] text-faint">{card.detail}</p>
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-[0.9375rem] font-medium text-fg">
                Ventes sur 30 jours
              </h2>
              <p className="mt-1 text-[0.75rem] text-subtle">
                Commandes payées, toutes boutiques.
              </p>
            </div>
            <p className="text-[1.25rem] font-medium tabular-nums text-fg">
              {formatMoney(data.gmv30, "XOF", "fr-FR")}
            </p>
          </div>

          <div className="mt-6 flex h-40 items-end gap-1">
            {data.series.map((point) => (
              <div
                key={point.date}
                title={`${point.date} · ${formatMoney(point.amount, "XOF", "fr-FR")}`}
                className="group relative flex-1"
              >
                <div
                  className="w-full rounded-t bg-brand-500/35 transition-colors group-hover:bg-brand-500"
                  style={{ height: `${Math.max(3, (point.amount / max) * 150)}px` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[0.625rem] text-faint">
            <span>{shortDate(data.series[0]?.date)}</span>
            <span>{shortDate(data.series[data.series.length - 1]?.date)}</span>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-[0.9375rem] font-medium text-fg">Alertes</h2>
          <div className="mt-4 space-y-2">
            <AlertRow
              href="/platform-admin/kyc"
              label="KYC en attente"
              value={data.kycPending}
              tone="amber"
            />
            <AlertRow
              href="/platform-admin/payouts"
              label="Retraits à traiter"
              value={data.payoutsPending}
              tone="amber"
            />
            <AlertRow
              href="/platform-admin/payments"
              label="Paiements échoués"
              value={data.failedPayments}
              tone="red"
            />
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[0.9375rem] font-medium text-fg">
              Top 5 marchands
            </h2>
            <p className="mt-1 text-[0.75rem] text-subtle">
              Par GMV cumulée sur les commandes payées.
            </p>
          </div>
          <Link
            href="/platform-admin/merchants"
            className="text-[0.75rem] font-medium text-accent hover:underline"
          >
            Tous les marchands
          </Link>
        </div>

        {data.topMerchants.length === 0 ? (
          <p className="mt-5 text-[0.8125rem] text-subtle">
            Aucune vente enregistrée pour le moment.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-hairline">
            {data.topMerchants.map((merchant, index) => (
              <div
                key={merchant.userId}
                className="flex flex-wrap items-center gap-3 py-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-hairline text-[0.6875rem] font-semibold text-subtle">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8125rem] font-medium text-fg">
                    {merchant.name}
                  </p>
                  <p className="truncate text-[0.6875rem] text-subtle">
                    {merchant.email} · {merchant.stores} boutique
                    {merchant.stores === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="rounded-full border border-border px-2.5 py-1 text-[0.625rem] uppercase text-subtle">
                  {merchant.plan}
                </span>
                <p className="w-28 text-end text-[0.8125rem] font-medium tabular-nums text-fg">
                  {formatMoney(merchant.gmv, "XOF", "fr-FR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function shortDate(value?: string): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function AlertRow({
  href,
  label,
  value,
  tone,
}: {
  href: string;
  label: string;
  value: number;
  tone: "amber" | "red";
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors hover:border-border-strong"
    >
      <span className="text-[0.75rem] text-body">{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${
          value > 0
            ? tone === "red"
              ? "bg-red-500/12 text-red-600 dark:text-red-400"
              : "bg-amber-500/12 text-amber-600 dark:text-amber-400"
            : "bg-hairline text-subtle"
        }`}
      >
        {value}
      </span>
    </Link>
  );
}
