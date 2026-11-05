import Link from "next/link";
import { AdminActionButton } from "@/components/platform/admin-action-button";
import { AdminHero } from "@/components/platform/admin-hero";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { listAdminStores } from "@/lib/platform/admin-queries";
import { formatMoney } from "@/lib/money";

export const metadata = { robots: { index: false, follow: false } };

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const stores = await listAdminStores();
  const search = (q ?? "").trim().toLowerCase();

  const filtered = stores.filter((store) => {
    if (
      search &&
      !store.name.toLowerCase().includes(search) &&
      !store.slug.toLowerCase().includes(search) &&
      !(store.ownerEmail ?? "").toLowerCase().includes(search)
    ) {
      return false;
    }
    if (status && status !== "all" && store.status !== status) return false;
    return true;
  });

  return (
    <div>
      <AdminHero subtitle="Toutes les boutiques de la plateforme, leur propriétaire, leur plan, leur activité et leur état de publication.">
        <ButtonLink href="/platform-admin/merchants" variant="light" size="pill">
          <Icon path={icons.users} className="h-4 w-4" strokeWidth={1.8} />
          Marchands
        </ButtonLink>
      </AdminHero>

      <form className="mt-6 flex flex-wrap items-end gap-2" method="get">
        <label className="min-w-48 flex-1">
          <span className="text-[0.625rem] uppercase tracking-[0.1em] text-faint">
            Rechercher
          </span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Boutique, slug, propriétaire…"
            className="mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-[0.8125rem] text-fg outline-none focus:border-brand-500"
          />
        </label>
        <label>
          <span className="text-[0.625rem] uppercase tracking-[0.1em] text-faint">
            Statut
          </span>
          <select
            name="status"
            defaultValue={status ?? "all"}
            className="mt-1 h-10 rounded-xl border border-border bg-surface px-3 text-[0.8125rem] text-fg"
          >
            <option value="all">Tous</option>
            <option value="active">Actives</option>
            <option value="draft">Brouillons</option>
            <option value="suspended">Suspendues</option>
          </select>
        </label>
        <button className="h-10 rounded-xl bg-brand-500 px-4 text-[0.75rem] font-medium text-white">
          Filtrer
        </button>
      </form>

      <p className="mt-4 text-[0.75rem] text-subtle">
        {filtered.length} boutique{filtered.length === 1 ? "" : "s"} sur{" "}
        {stores.length}.
      </p>

      <div className="mt-3 overflow-hidden rounded-3xl border border-border bg-surface">
        <table className="hidden w-full md:table">
          <thead>
            <tr className="border-b border-border text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-faint">
              <th className="px-5 py-3 text-start">Boutique</th>
              <th className="px-4 py-3 text-start">Propriétaire</th>
              <th className="px-4 py-3 text-start">Plan</th>
              <th className="px-4 py-3 text-end">Commandes</th>
              <th className="px-4 py-3 text-end">GMV</th>
              <th className="px-4 py-3 text-start">Statut</th>
              <th className="px-5 py-3 text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((store) => (
              <tr
                key={store.id}
                className="border-b border-hairline last:border-0 hover:bg-hairline/30"
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/platform-admin/stores/${store.id}`}
                    className="text-[0.8125rem] font-medium text-fg hover:text-accent"
                  >
                    {store.name}
                  </Link>
                  <p className="text-[0.6875rem] text-faint">
                    /{store.slug} · {store.country}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-[0.75rem] text-body">
                    {store.ownerName ?? "—"}
                  </p>
                  <p className="text-[0.6875rem] text-faint">
                    {store.ownerEmail ?? ""}
                  </p>
                </td>
                <td className="px-4 py-3 text-[0.75rem] text-subtle">
                  {store.plan}
                </td>
                <td className="px-4 py-3 text-end text-[0.75rem] tabular-nums text-body">
                  {store.orders}
                </td>
                <td className="px-4 py-3 text-end text-[0.75rem] font-medium tabular-nums text-fg">
                  {formatMoney(store.gmv, store.currency, "fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[0.6875rem] ${
                      store.status === "active"
                        ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                        : store.status === "suspended"
                          ? "bg-red-500/12 text-red-600 dark:text-red-400"
                          : "bg-hairline text-subtle"
                    }`}
                  >
                    {store.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-end">
                  <AdminActionButton
                    kind="store"
                    id={store.id}
                    suspend={store.status !== "suspended"}
                    label={store.status === "suspended" ? "Réactiver" : "Suspendre"}
                    tone={store.status === "suspended" ? "primary" : "danger"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="divide-y divide-hairline md:hidden">
          {filtered.map((store) => (
            <li key={store.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/platform-admin/stores/${store.id}`}
                    className="text-[0.875rem] font-medium text-fg"
                  >
                    {store.name}
                  </Link>
                  <p className="text-[0.6875rem] text-subtle">
                    /{store.slug} · {store.ownerName ?? "—"}
                  </p>
                  <p className="mt-1 text-[0.6875rem] text-faint">
                    {store.orders} commandes ·{" "}
                    {formatMoney(store.gmv, store.currency, "fr-FR")}
                  </p>
                </div>
                <span className="rounded-full bg-hairline px-2.5 py-1 text-[0.625rem] text-subtle">
                  {store.status}
                </span>
              </div>
              <div className="mt-3">
                <AdminActionButton
                  kind="store"
                  id={store.id}
                  suspend={store.status !== "suspended"}
                  label={store.status === "suspended" ? "Réactiver" : "Suspendre"}
                  tone={store.status === "suspended" ? "primary" : "danger"}
                />
              </div>
            </li>
          ))}
        </ul>

        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-[0.8125rem] text-subtle">
            Aucune boutique ne correspond à ces filtres.
          </p>
        ) : null}
      </div>
    </div>
  );
}
