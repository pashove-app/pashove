import { BackLink } from "@/components/ui/back-link";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPayoutActions } from "@/components/platform/admin-payout-actions";
import { AdminStatusBadge } from "@/components/platform/admin-status-badge";
import { adminKycForStore, getAdminPayout } from "@/lib/platform/queries";
import { formatMoney } from "@/lib/money";

export default async function AdminPayoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payout = await getAdminPayout(id);
  if (!payout) notFound();

  const kyc = await adminKycForStore(payout.store_id);
  const kycApproved = kyc?.status === "approved";

  const date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat("fr-FR", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "—";

  return (
    <div className="mx-auto w-full max-w-4xl">
      <BackLink href="/platform-admin/payouts" label="Retour aux retraits" />

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.75rem] font-medium text-faint">
            {payout.store?.name ?? "Boutique"} · /{payout.store?.slug ?? "—"}
          </p>
          <h1 className="mt-1 text-[2rem] font-semibold tracking-[-0.03em] tabular-nums text-fg">
            {formatMoney(payout.amount, payout.currency, "fr-FR")}
          </h1>
          <p className="mt-1 text-[0.8125rem] text-subtle">
            {payout.provider} · •••• {payout.account_last4}
          </p>
        </div>
        <AdminStatusBadge status={payout.status} kind="payout" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-[0.9375rem] font-medium text-fg">
            Traitement du retrait
          </h2>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
            Aucun virement automatique n’est encore branché. Marque les étapes
            au fur et à mesure ; le ledger enregistre le paiement à la
            complétion et libère les fonds en cas d’échec.
          </p>
          <AdminPayoutActions
            payoutId={payout.id}
            status={payout.status}
            kycApproved={kycApproved}
          />
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-border bg-surface p-5">
            <h2 className="text-[0.9375rem] font-medium text-fg">KYC</h2>
            <div className="mt-2 flex items-center justify-between gap-3">
              <AdminStatusBadge
                status={kyc?.status ?? "not_started"}
                kind="kyc"
              />
              {kyc ? (
                <Link
                  href={`/platform-admin/kyc/${kyc.id}`}
                  className="text-[0.75rem] font-medium text-accent"
                >
                  Ouvrir
                </Link>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-surface p-5">
            <h2 className="text-[0.9375rem] font-medium text-fg">Chronologie</h2>
            <dl className="mt-3 space-y-2 text-[0.75rem]">
              {[
                ["Demandé", payout.requested_at],
                ["Revu", payout.reviewed_at],
                ["Envoyé", payout.sent_at],
                ["Terminé", payout.completed_at],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between gap-3">
                  <dt className="text-subtle">{label as string}</dt>
                  <dd className="text-body">{date(value as string | null)}</dd>
                </div>
              ))}
            </dl>
            {payout.provider_reference ? (
              <p className="mt-3 border-t border-hairline pt-3 text-[0.75rem] text-subtle">
                Référence : <span className="font-mono text-body">{payout.provider_reference}</span>
              </p>
            ) : null}
            {payout.failure_reason ? (
              <p className="mt-2 text-[0.75rem] text-red-500">
                Motif : {payout.failure_reason}
              </p>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
