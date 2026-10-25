import Link from "next/link";
import { AdminHero } from "@/components/platform/admin-hero";
import { AdminStatusBadge } from "@/components/platform/admin-status-badge";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { listAdminKycCases } from "@/lib/platform/queries";

export default async function AdminKycPage() {
  const cases = await listAdminKycCases();
  const pending = cases.filter((item) =>
    ["submitted", "under_review"].includes(item.status),
  );

  return (
    <div>
      <AdminHero subtitle="Les dossiers d'identité des marchands, leurs documents privés et les décisions de conformité.">
        <ButtonLink href="/platform-admin" variant="light" size="pill">
          <Icon path={icons.chart} className="h-4 w-4" strokeWidth={1.8} />
          Vue d’ensemble
        </ButtonLink>
      </AdminHero>

      <p className="mt-5 text-[0.875rem] text-muted">
        {pending.length} dossier{pending.length === 1 ? "" : "s"} à traiter.
      </p>

      {cases.length === 0 ? (
        <div className="mt-7 rounded-3xl border border-border bg-surface px-6 py-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/[0.12] text-accent">
            <Icon path={icons.shield} className="h-6 w-6" strokeWidth={1.7} />
          </span>
          <p className="mt-4 text-[0.9375rem] font-medium text-fg">
            Aucun dossier KYC
          </p>
          <p className="mt-1 text-[0.8125rem] text-subtle">
            Les soumissions des marchands apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="mt-7 overflow-hidden rounded-3xl border border-border bg-surface">
          <table className="hidden w-full md:table">
            <thead>
              <tr className="border-b border-border text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-faint">
                <th className="px-5 py-3 text-start">Marchand</th>
                <th className="px-4 py-3 text-start">Identité</th>
                <th className="px-4 py-3 text-start">Soumis</th>
                <th className="px-4 py-3 text-start">Statut</th>
                <th className="px-5 py-3 text-end">Dossier</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr key={item.id} className="border-b border-border transition-colors last:border-0 hover:bg-hairline/30">
                  <td className="px-5 py-3">
                    <p className="text-[0.875rem] font-medium text-fg">
                      {item.store?.name ?? "Boutique"}
                    </p>
                    <p className="font-mono text-[0.75rem] text-faint">
                      /{item.store?.slug ?? "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[0.8125rem] text-body">{item.legal_name}</p>
                    <p className="text-[0.6875rem] text-faint">
                      {item.document_type.replace("_", " ")} · {item.document_last4}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[0.8125rem] text-muted">
                    {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                      new Date(item.submitted_at),
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge status={item.status} />
                  </td>
                  <td className="px-5 py-3 text-end">
                    <Link
                      href={`/platform-admin/kyc/${item.id}`}
                      className="inline-flex h-9 items-center rounded-full border border-border px-4 text-[0.75rem] font-medium text-body transition-colors hover:border-brand-500 hover:text-accent"
                    >
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-border md:hidden">
            {cases.map((item) => (
              <li key={item.id}>
                <Link href={`/platform-admin/kyc/${item.id}`} className="block p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.875rem] font-medium text-fg">
                        {item.store?.name ?? "Boutique"}
                      </p>
                      <p className="mt-0.5 text-[0.75rem] text-subtle">
                        {item.legal_name}
                      </p>
                      <p className="mt-1 text-[0.6875rem] text-faint">
                        {item.document_type.replace("_", " ")} · {item.document_last4}
                      </p>
                    </div>
                    <AdminStatusBadge status={item.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
