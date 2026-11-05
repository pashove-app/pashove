import Link from "next/link";
import { AdminHero } from "@/components/platform/admin-hero";
import { AdminStatusBadge } from "@/components/platform/admin-status-badge";
import { AdminActionButton } from "@/components/platform/admin-action-button";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { listAdminMerchants } from "@/lib/platform/admin-queries";
import { formatMoney } from "@/lib/money";

export const metadata = { robots: { index: false, follow: false } };

function StatusPill({ suspended }: { suspended: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[0.6875rem] font-medium ${
        suspended
          ? "bg-red-500/12 text-red-600 dark:text-red-400"
          : "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
      }`}
    >
      {suspended ? "Suspendu" : "Actif"}
    </span>
  );
}

export default async function MerchantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string; status?: string }>;
}) {
  const { q, plan, status } = await searchParams;
  const merchants = await listAdminMerchants();

  const search = (q ?? "").trim().toLowerCase();
  const filtered = merchants.filter((merchant) => {
    if (
      search &&
      !merchant.name.toLowerCase().includes(search) &&
      !merchant.email.toLowerCase().includes(search) &&
      !(merchant.storeNames ?? "").toLowerCase().includes(search)
    ) {
      return false;
    }
    if (plan && plan !== "all" && merchant.plan !== plan) return false;
    if (status === "suspended" && !merchant.suspended) return false;
    if (status === "active" && merchant.suspended) return false;
    return true;
  });

  return (
    <div>
      <AdminHero subtitle="Les propriétaires de boutiques, leur plan, leur chiffre d’affaires, leur vérification et leur statut.">
        <ButtonLink href="/platform-admin/stores" variant="light" size="pill">
          <Icon path={icons.store} className="h-4 w-4" strokeWidth={1.8} />
          Voir les boutiques
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
            placeholder="Nom, e-mail, boutique…"
            className="mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-[0.8125rem] text-fg outline-none focus:border-brand-500"
          />
        </label>
        <label>
          <span className="text-[0.625rem] uppercase tracking-[0.1em] text-faint">
            Plan
          </span>
          <select
            name="plan"
            defaultValue={plan ?? "all"}
            className="mt-1 h-10 rounded-xl border border-border bg-surface px-3 text-[0.8125rem] text-fg"
          >
            <option value="all">Tous</option>
            <option value="free">Free</option>
            <option value="standard">Standard</option>
            <option value="pro">Pro</option>
          </select>
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
            <option value="active">Actifs</option>
            <option value="suspended">Suspendus</option>
          </select>
        </label>
        <button
          type="submit"
          className="h-10 rounded-xl bg-brand-500 px-4 text-[0.75rem] font-medium text-white"
        >
          Filtrer
        </button>
      </form>

      <p className="mt-4 text-[0.75rem] text-subtle">
        {filtered.length} marchand{filtered.length === 1 ? "" : "s"} sur{" "}
        {merchants.length}.
      </p>

      <div className="mt-3 overflow-hidden rounded-3xl border border-border bg-surface">
        <table className="hidden w-full md:table">
          <thead>
            <tr className="border-b border-border text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-faint">
              <th className="px-5 py-3 text-start">Marchand</th>
              <th className="px-4 py-3 text-start">Plan</th>
              <th className="px-4 py-3 text-start">Boutiques</th>
              <th className="px-4 py-3 text-end">GMV</th>
              <th className="px-4 py-3 text-start">KYC</th>
              <th className="px-4 py-3 text-start">Statut</th>
              <th className="px-5 py-3 text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((merchant) => (
              <tr
                key={merchant.userId}
                className="border-b border-hairline last:border-0 hover:bg-hairline/30"
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/platform-admin/merchants/${merchant.userId}`}
                    className="text-[0.8125rem] font-medium text-fg hover:text-accent"
                  >
                    {merchant.name}
                  </Link>
                  <p className="text-[0.6875rem] text-faint">{merchant.email}</p>
                </td>
                <td className="px-4 py-3 text-[0.75rem] text-body">
                  {merchant.planName}
                </td>
                <td className="px-4 py-3 text-[0.75rem] text-subtle">
                  <span className="font-medium text-body">{merchant.stores}</span>
                  {merchant.storeNames ? (
                    <span className="block max-w-48 truncate text-[0.6875rem] text-faint">
                      {merchant.storeNames}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-end text-[0.75rem] font-medium tabular-nums text-fg">
                  {formatMoney(merchant.gmv, merchant.currency, "fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <AdminStatusBadge status={merchant.kyc} />
                </td>
                <td className="px-4 py-3">
                  <StatusPill suspended={merchant.suspended} />
                </td>
                <td className="px-5 py-3 text-end">
                  <AdminActionButton
                    kind="merchant"
                    id={merchant.userId}
                    suspend={!merchant.suspended}
                    label={merchant.suspended ? "Réactiver" : "Suspendre"}
                    tone={merchant.suspended ? "primary" : "danger"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="divide-y divide-hairline md:hidden">
          {filtered.map((merchant) => (
            <li key={merchant.userId} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/platform-admin/merchants/${merchant.userId}`}
                    className="text-[0.875rem] font-medium text-fg"
                  >
                    {merchant.name}
                  </Link>
                  <p className="truncate text-[0.6875rem] text-subtle">
                    {merchant.email}
                  </p>
                  <p className="mt-1 text-[0.6875rem] text-faint">
                    {merchant.planName} · {merchant.stores} boutique
                    {merchant.stores === 1 ? "" : "s"} ·{" "}
                    {formatMoney(merchant.gmv, merchant.currency, "fr-FR")}
                  </p>
                </div>
                <StatusPill suspended={merchant.suspended} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <AdminStatusBadge status={merchant.kyc} />
                <AdminActionButton
                  kind="merchant"
                  id={merchant.userId}
                  suspend={!merchant.suspended}
                  label={merchant.suspended ? "Réactiver" : "Suspendre"}
                  tone={merchant.suspended ? "primary" : "danger"}
                />
              </div>
            </li>
          ))}
        </ul>

        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-[0.8125rem] text-subtle">
            Aucun marchand ne correspond à ces filtres.
          </p>
        ) : null}
      </div>
    </div>
  );
}
