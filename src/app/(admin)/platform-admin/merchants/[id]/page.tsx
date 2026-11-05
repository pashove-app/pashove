import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminActionButton } from "@/components/platform/admin-action-button";
import { AdminHero } from "@/components/platform/admin-hero";
import { AdminStatusBadge } from "@/components/platform/admin-status-badge";
import { Icon, icons } from "@/components/ui/primitives";
import { getAdminMerchant } from "@/lib/platform/admin-queries";
import { formatMoney } from "@/lib/money";

export const metadata = { robots: { index: false, follow: false } };

export default async function MerchantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAdminMerchant(id);
  if (!data?.merchant) notFound();

  const merchant = data.merchant;
  const gmv = data.orders
    .filter((order) => order.paymentStatus === "paid")
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <div>
      <AdminHero
        title={merchant.name}
        subtitle={`${merchant.email} · ${merchant.planName} · inscrit le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(merchant.createdAt))}`}
      >
        <div className="flex flex-wrap gap-2">
          <AdminActionButton
            kind="merchant"
            id={merchant.userId}
            suspend={!merchant.suspended}
            label={merchant.suspended ? "Réactiver le marchand" : "Suspendre le marchand"}
            tone={merchant.suspended ? "primary" : "danger"}
            variant="hero"
          />
          <Link
            href="/platform-admin/merchants"
            className="inline-flex h-9 items-center rounded-full bg-white px-4 text-[0.75rem] font-medium text-[#1d1d1f]"
          >
            Tous les marchands
          </Link>
        </div>
      </AdminHero>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="GMV récente" value={formatMoney(gmv, "XOF", "fr-FR")} />
        <Stat label="Boutiques" value={String(data.stores.length)} />
        <Stat label="Commandes" value={String(data.orders.length)} />
        <Stat label="Retraits" value={String(data.payouts.length)} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-[0.9375rem] font-medium text-fg">Identité</h2>
          <dl className="mt-4 space-y-3 text-[0.8125rem]">
            <Row label="E-mail" value={merchant.email} />
            <Row label="Téléphone" value={merchant.phone ?? "—"} />
            <Row label="Pays" value={merchant.country ?? "—"} />
            <Row label="Langue" value={merchant.language} />
            <Row label="Plan" value={merchant.planName} />
            <Row
              label="Statut"
              value={merchant.suspended ? "Suspendu" : "Actif"}
            />
          </dl>
        </section>

        <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[0.9375rem] font-medium text-fg">Boutiques</h2>
            <span className="text-[0.6875rem] text-faint">
              {data.stores.length}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {data.stores.map((store) => (
              <Link
                key={store.id}
                href={`/platform-admin/stores/${store.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 hover:border-border-strong"
              >
                <div>
                  <p className="text-[0.8125rem] font-medium text-fg">
                    {store.name}
                  </p>
                  <p className="text-[0.6875rem] text-subtle">
                    /{store.slug} · {store.country}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.625rem] ${
                    store.status === "active"
                      ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                      : "bg-hairline text-subtle"
                  }`}
                >
                  {store.status}
                </span>
              </Link>
            ))}
            {data.stores.length === 0 ? (
              <p className="text-[0.8125rem] text-subtle">Aucune boutique.</p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">Vérification KYC</h2>
        <div className="mt-3 space-y-2">
          {data.kyc.length === 0 ? (
            <p className="text-[0.8125rem] text-subtle">Aucun dossier KYC.</p>
          ) : (
            data.kyc.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
              >
                <div>
                  <p className="text-[0.8125rem] text-body">{item.legalName}</p>
                  <p className="text-[0.6875rem] text-subtle">
                    {item.storeName} ·{" "}
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "medium",
                    }).format(new Date(item.submittedAt))}
                  </p>
                </div>
                <AdminStatusBadge status={item.status} />
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex items-center justify-between gap-2 px-5 py-4">
          <h2 className="text-[0.9375rem] font-medium text-fg">
            Dernières commandes
          </h2>
          <Icon path={icons.box} className="h-4 w-4 text-faint" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-[0.75rem]">
            <thead>
              <tr className="border-y border-border text-[0.625rem] uppercase tracking-[0.1em] text-faint">
                <th className="px-5 py-2.5 font-medium">Commande</th>
                <th className="px-4 py-2.5 font-medium">Boutique</th>
                <th className="px-4 py-2.5 font-medium">Paiement</th>
                <th className="px-4 py-2.5 text-end font-medium">Total</th>
                <th className="px-5 py-2.5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => (
                <tr key={order.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-2.5 font-medium text-fg">
                    #{order.number}
                  </td>
                  <td className="px-4 py-2.5 text-subtle">{order.storeName}</td>
                  <td className="px-4 py-2.5 text-body">
                    {order.paymentStatus}
                  </td>
                  <td className="px-4 py-2.5 text-end tabular-nums text-fg">
                    {formatMoney(order.total, order.currency, "fr-FR")}
                  </td>
                  <td className="px-5 py-2.5 text-subtle">
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "short",
                    }).format(new Date(order.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.orders.length === 0 ? (
          <p className="px-5 py-8 text-center text-[0.8125rem] text-subtle">
            Aucune commande.
          </p>
        ) : null}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-[0.6875rem] text-subtle">{label}</p>
      <p className="mt-1 truncate text-[1.125rem] font-semibold tabular-nums text-fg">
        {value}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-subtle">{label}</dt>
      <dd className="text-end font-medium text-fg">{value}</dd>
    </div>
  );
}
