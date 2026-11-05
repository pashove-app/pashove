import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminActionButton } from "@/components/platform/admin-action-button";
import { AdminHero } from "@/components/platform/admin-hero";
import { Icon, icons } from "@/components/ui/primitives";
import { getAdminStore } from "@/lib/platform/admin-queries";
import { formatMoney } from "@/lib/money";

export const metadata = { robots: { index: false, follow: false } };

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAdminStore(id);
  if (!data?.store) notFound();

  const store = data.store;
  const paid = data.orders.filter((order) => order.paymentStatus === "paid");
  const gmv = paid.reduce((sum, order) => sum + order.total, 0);

  return (
    <div>
      <AdminHero
        title={store.name}
        subtitle={`/${store.slug} · ${store.country} · ${store.currency} · ${store.status}`}
      >
        <div className="flex flex-wrap gap-2">
          <AdminActionButton
            kind="store"
            id={store.id}
            suspend={store.status !== "suspended"}
            label={store.status === "suspended" ? "Réactiver la boutique" : "Suspendre la boutique"}
            tone={store.status === "suspended" ? "primary" : "danger"}
            variant="hero"
          />
          <Link
            href="/platform-admin/stores"
            className="inline-flex h-9 items-center rounded-full bg-white px-4 text-[0.75rem] font-medium text-[#1d1d1f]"
          >
            Toutes les boutiques
          </Link>
        </div>
      </AdminHero>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Commandes" value={String(data.orders.length)} />
        <Stat label="GMV payée" value={formatMoney(gmv, store.currency, "fr-FR")} />
        <Stat label="Propriétaire" value={data.owner?.name ?? "—"} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-[0.9375rem] font-medium text-fg">Boutique</h2>
          <dl className="mt-4 space-y-3 text-[0.8125rem]">
            <Row label="Propriétaire" value={data.owner?.name ?? "—"} />
            <Row label="E-mail" value={data.owner?.email ?? "—"} />
            <Row label="Pays" value={store.country} />
            <Row label="Devise" value={store.currency} />
            <Row
              label="Créée le"
              value={new Intl.DateTimeFormat("fr-FR", {
                dateStyle: "long",
              }).format(new Date(store.createdAt))}
            />
          </dl>
          {data.owner ? (
            <Link
              href={`/platform-admin/merchants/${data.owner.userId}`}
              className="mt-4 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-accent hover:underline"
            >
              Voir le marchand
              <Icon path={icons.arrowRight} className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-3xl border border-border bg-surface">
          <div className="flex items-center justify-between gap-2 px-5 py-4">
            <h2 className="text-[0.9375rem] font-medium text-fg">Commandes</h2>
            <span className="text-[0.6875rem] text-faint">
              {data.orders.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[0.75rem]">
              <thead>
                <tr className="border-y border-border text-[0.625rem] uppercase tracking-[0.1em] text-faint">
                  <th className="px-5 py-2.5 font-medium">Commande</th>
                  <th className="px-4 py-2.5 font-medium">Client</th>
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
                    <td className="px-4 py-2.5 text-subtle">
                      {order.customerName}
                    </td>
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
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-[0.6875rem] text-subtle">{label}</p>
      <p className="mt-1 truncate text-[1.125rem] font-semibold text-fg">
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
