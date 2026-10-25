import Link from "next/link";
import { AdminHero } from "@/components/platform/admin-hero";
import { BackLink } from "@/components/ui/back-link";
import { Icon, icons } from "@/components/ui/primitives";
import { listAudit } from "@/lib/platform/queries";

const ACTION_LABEL: Record<string, string> = {
  "kyc.submitted": "KYC soumis",
  "kyc.approved": "KYC approuvé",
  "kyc.rejected": "KYC rejeté",
  "kyc.resubmission_required": "KYC à corriger",
  "payout.processing": "Retrait en traitement",
  "payout.sent": "Retrait envoyé",
  "payout.completed": "Retrait terminé",
  "payout.failed": "Retrait échoué",
};

function details(metadata: Record<string, unknown> | null): string {
  if (!metadata) return "—";
  const entries = Object.entries(metadata).filter(
    ([, value]) => value !== null && value !== "",
  );
  if (entries.length === 0) return "—";
  return entries
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = Math.max(Number.parseInt(rawPage ?? "1", 10) || 1, 1);
  const entries = await listAudit(50, (page - 1) * 50);

  return (
    <div>
      <BackLink href="/platform-admin" label="Retour à l'administration" />

      <div className="mt-4">
        <AdminHero subtitle="Les actions sensibles, qui les a faites et quand : KYC, retraits et décisions de l’équipe." />
      </div>

      {entries.length === 0 ? (
        <div className="mt-7 rounded-3xl border border-border bg-surface px-6 py-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/[0.12] text-accent">
            <Icon path={icons.list} className="h-6 w-6" strokeWidth={1.7} />
          </span>
          <p className="mt-4 text-[0.9375rem] font-medium text-fg">
            Aucune action enregistrée
          </p>
        </div>
      ) : (
        <div className="mt-7 overflow-hidden rounded-3xl border border-border bg-surface">
          <table className="hidden w-full md:table">
            <thead>
              <tr className="border-b border-border text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
                <th className="px-5 py-3 text-start">Date</th>
                <th className="px-4 py-3 text-start">Auteur</th>
                <th className="px-4 py-3 text-start">Action</th>
                <th className="px-4 py-3 text-start">Cible</th>
                <th className="px-5 py-3 text-start">Détails</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-border transition-colors last:border-0 hover:bg-hairline/30">
                  <td className="px-5 py-3 text-[0.75rem] text-muted">
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(entry.created_at))}
                  </td>
                  <td className="px-4 py-3 text-[0.8125rem] text-body">
                    {entry.actor_email ?? "Système"}
                  </td>
                  <td className="px-4 py-3 text-[0.8125rem] font-medium text-fg">
                    {ACTION_LABEL[entry.action] ?? entry.action}
                  </td>
                  <td className="px-4 py-3 text-[0.75rem] text-subtle">
                    {entry.target_type}
                    {entry.target_id ? ` · ${entry.target_id.slice(0, 8)}` : ""}
                  </td>
                  <td className="max-w-[24rem] px-5 py-3 text-[0.75rem] text-subtle">
                    <span className="line-clamp-2">{details(entry.metadata)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-border md:hidden">
            {entries.map((entry) => (
              <li key={entry.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.8125rem] font-medium text-fg">
                      {ACTION_LABEL[entry.action] ?? entry.action}
                    </p>
                    <p className="mt-0.5 text-[0.6875rem] text-faint">
                      {new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(entry.created_at))}
                    </p>
                  </div>
                  <p className="max-w-[9rem] truncate text-[0.6875rem] text-subtle">
                    {entry.actor_email ?? "Système"}
                  </p>
                </div>
                <p className="mt-2 line-clamp-2 text-[0.75rem] text-subtle">
                  {details(entry.metadata)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        {page > 1 ? (
          <Link
            href={`/platform-admin/audit?page=${page - 1}`}
            className="inline-flex h-10 items-center rounded-full border border-border px-4 text-[0.75rem] font-medium text-subtle hover:text-fg"
          >
            Précédent
          </Link>
        ) : (
          <span />
        )}
        {entries.length === 50 ? (
          <Link
            href={`/platform-admin/audit?page=${page + 1}`}
            className="inline-flex h-10 items-center rounded-full border border-border px-4 text-[0.75rem] font-medium text-subtle hover:text-fg"
          >
            Suivant
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
