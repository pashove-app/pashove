import Link from "next/link";
import { AdminActionButton } from "@/components/platform/admin-action-button";
import { AdminHero } from "@/components/platform/admin-hero";
import { Icon, icons } from "@/components/ui/primitives";
import { listAdminUsers } from "@/lib/platform/admin-queries";

export const metadata = { robots: { index: false, follow: false } };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const { q, role } = await searchParams;
  const users = await listAdminUsers();
  const search = (q ?? "").trim().toLowerCase();

  const filtered = users.filter((user) => {
    if (
      search &&
      !user.name.toLowerCase().includes(search) &&
      !user.email.toLowerCase().includes(search)
    ) {
      return false;
    }
    if (role === "merchant" && !user.merchant) return false;
    if (role === "customer" && user.merchant) return false;
    if (role === "staff" && !user.platformAdmin) return false;
    if (role === "suspended" && !user.suspended) return false;
    return true;
  });

  return (
    <div>
      <AdminHero subtitle="Tous les comptes de la plateforme : marchands, clients, équipe interne, statut de sécurité et activité.">
        <Link
          href="/platform-admin/merchants"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[0.75rem] font-medium text-[#1d1d1f]"
        >
          <Icon path={icons.users} className="h-3.5 w-3.5" strokeWidth={1.8} />
          Marchands
        </Link>
      </AdminHero>

      <form className="mt-6 flex flex-wrap items-end gap-2" method="get">
        <label className="min-w-48 flex-1">
          <span className="text-[0.625rem] uppercase tracking-[0.1em] text-faint">
            Rechercher
          </span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Nom ou e-mail…"
            className="mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-[0.8125rem] text-fg outline-none focus:border-brand-500"
          />
        </label>
        <label>
          <span className="text-[0.625rem] uppercase tracking-[0.1em] text-faint">
            Rôle
          </span>
          <select
            name="role"
            defaultValue={role ?? "all"}
            className="mt-1 h-10 rounded-xl border border-border bg-surface px-3 text-[0.8125rem] text-fg"
          >
            <option value="all">Tous</option>
            <option value="merchant">Marchands</option>
            <option value="customer">Clients</option>
            <option value="staff">Équipe</option>
            <option value="suspended">Suspendus</option>
          </select>
        </label>
        <button className="h-10 rounded-xl bg-brand-500 px-4 text-[0.75rem] font-medium text-white">
          Filtrer
        </button>
      </form>

      <p className="mt-4 text-[0.75rem] text-subtle">
        {filtered.length} compte{filtered.length === 1 ? "" : "s"} sur{" "}
        {users.length}.
      </p>

      <div className="mt-3 overflow-hidden rounded-3xl border border-border bg-surface">
        <table className="hidden w-full md:table">
          <thead>
            <tr className="border-b border-border text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-faint">
              <th className="px-5 py-3 text-start">Compte</th>
              <th className="px-4 py-3 text-start">Rôle</th>
              <th className="px-4 py-3 text-end">Boutiques</th>
              <th className="px-4 py-3 text-end">Commandes</th>
              <th className="px-4 py-3 text-start">Statut</th>
              <th className="px-5 py-3 text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr
                key={user.userId}
                className="border-b border-hairline last:border-0 hover:bg-hairline/30"
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/platform-admin/users/${user.userId}`}
                    className="text-[0.8125rem] font-medium text-fg hover:text-accent"
                  >
                    {user.name}
                  </Link>
                  <p className="text-[0.6875rem] text-faint">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {user.platformAdmin ? (
                      <RolePill label="Équipe" tone="blue" />
                    ) : user.merchant ? (
                      <RolePill label="Marchand" tone="violet" />
                    ) : (
                      <RolePill label="Client" tone="neutral" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-end text-[0.75rem] tabular-nums text-body">
                  {user.stores}
                </td>
                <td className="px-4 py-3 text-end text-[0.75rem] tabular-nums text-body">
                  {user.orders}
                </td>
                <td className="px-4 py-3">
                  <RolePill
                    label={user.suspended ? "Suspendu" : "Actif"}
                    tone={user.suspended ? "red" : "green"}
                  />
                </td>
                <td className="px-5 py-3">
                  {user.platformAdmin ? (
                    <span className="text-[0.6875rem] text-faint">
                      Compte protégé
                    </span>
                  ) : (
                    <div className="flex flex-wrap justify-end gap-2">
                      <AdminActionButton
                        kind="reset"
                        id={user.userId}
                        label="Reset sécurité"
                      />
                      <AdminActionButton
                        kind="user"
                        id={user.userId}
                        suspend={!user.suspended}
                        label={user.suspended ? "Réactiver" : "Suspendre"}
                        tone={user.suspended ? "primary" : "danger"}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="divide-y divide-hairline md:hidden">
          {filtered.map((user) => (
            <li key={user.userId} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/platform-admin/users/${user.userId}`}
                    className="truncate text-[0.875rem] font-medium text-fg"
                  >
                    {user.name}
                  </Link>
                  <p className="truncate text-[0.6875rem] text-subtle">
                    {user.email}
                  </p>
                  <p className="mt-1 text-[0.6875rem] text-faint">
                    {user.stores} boutique{user.stores === 1 ? "" : "s"} ·{" "}
                    {user.orders} commande{user.orders === 1 ? "" : "s"}
                  </p>
                </div>
                <RolePill
                  label={user.suspended ? "Suspendu" : "Actif"}
                  tone={user.suspended ? "red" : "green"}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {user.platformAdmin ? (
                  <span className="text-[0.6875rem] text-faint">
                    Compte plateforme protégé
                  </span>
                ) : (
                  <>
                    <AdminActionButton kind="reset" id={user.userId} label="Reset sécurité" />
                    <AdminActionButton
                      kind="user"
                      id={user.userId}
                      suspend={!user.suspended}
                      label={user.suspended ? "Réactiver" : "Suspendre"}
                      tone={user.suspended ? "primary" : "danger"}
                    />
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>

        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-[0.8125rem] text-subtle">
            Aucun compte ne correspond à ces filtres.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function RolePill({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "blue" | "violet" | "green" | "red";
}) {
  const classes = {
    neutral: "bg-hairline text-subtle",
    blue: "bg-blue-500/12 text-blue-600 dark:text-blue-400",
    violet: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
    green: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
    red: "bg-red-500/12 text-red-600 dark:text-red-400",
  }[tone];

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.625rem] font-medium ${classes}`}>
      {label}
    </span>
  );
}
