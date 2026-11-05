import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminActionButton } from "@/components/platform/admin-action-button";
import { AdminHero } from "@/components/platform/admin-hero";
import { getAdminUser } from "@/lib/platform/admin-queries";
import { formatMoney } from "@/lib/money";

export const metadata = { robots: { index: false, follow: false } };

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAdminUser(id);
  if (!data?.user) notFound();

  const user = data.user;

  return (
    <div>
      <AdminHero
        title={user.name}
        subtitle={`${user.email} · ${user.platformAdmin ? "équipe plateforme" : "compte client"} · inscrit le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(user.createdAt))}`}
      >
        <div className="flex flex-wrap gap-2">
          <AdminActionButton
            kind="reset"
            id={user.userId}
            label="Réinitialiser la sécurité"
          />
          <AdminActionButton
            kind="user"
            id={user.userId}
            suspend={!user.suspended}
            label={user.suspended ? "Réactiver" : "Suspendre"}
            tone={user.suspended ? "primary" : "danger"}
            variant="hero"
          />
        </div>
      </AdminHero>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-[0.9375rem] font-medium text-fg">Profil</h2>
          <dl className="mt-4 space-y-3 text-[0.8125rem]">
            <Row label="E-mail" value={user.email} />
            <Row label="Téléphone" value={user.phone ?? "—"} />
            <Row label="Pays" value={user.country ?? "—"} />
            <Row label="Langue" value={user.language} />
            <Row label="Statut" value={user.suspended ? "Suspendu" : "Actif"} />
            <Row
              label="Équipe plateforme"
              value={user.platformAdmin ? "Oui" : "Non"}
            />
          </dl>
        </section>

        <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-[0.9375rem] font-medium text-fg">Boutiques</h2>
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
                  <p className="text-[0.6875rem] text-subtle">/{store.slug}</p>
                </div>
                <span className="rounded-full bg-hairline px-2 py-0.5 text-[0.625rem] text-subtle">
                  {store.status}
                </span>
              </Link>
            ))}
            {data.stores.length === 0 ? (
              <p className="text-[0.8125rem] text-subtle">
                Aucune boutique possédée.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex items-center justify-between gap-2 px-5 py-4">
          <h2 className="text-[0.9375rem] font-medium text-fg">
            Commandes récentes
          </h2>
          <span className="text-[0.6875rem] text-faint">
            {data.orders.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-[0.75rem]">
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
                  <td className="px-4 py-2.5 text-body">{order.paymentStatus}</td>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-subtle">{label}</dt>
      <dd className="text-end font-medium text-fg">{value}</dd>
    </div>
  );
}
