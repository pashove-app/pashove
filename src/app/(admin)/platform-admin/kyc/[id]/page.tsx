import { BackLink } from "@/components/ui/back-link";
import { notFound } from "next/navigation";
import { AdminKycReview } from "@/components/platform/admin-kyc-review";
import { KycDocumentViewer } from "@/components/platform/kyc-document-viewer";
import { AdminStatusBadge } from "@/components/platform/admin-status-badge";
import { getAdminKycCase } from "@/lib/platform/queries";
import { signDownload } from "@/lib/r2/client";

const DOCUMENT_LABEL: Record<string, string> = {
  national_id: "Carte d'identité",
  passport: "Passeport",
  driver_license: "Permis de conduire",
  residence_permit: "Titre de séjour",
};

export default async function AdminKycDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getAdminKycCase(id);
  if (!item) notFound();

  const [front, back, selfie] = await Promise.all([
    item.front?.object_key
      ? signDownload(item.front.object_key, "kyc_document")
      : null,
    item.back?.object_key
      ? signDownload(item.back.object_key, "kyc_document")
      : null,
    item.selfie?.object_key
      ? signDownload(item.selfie.object_key, "kyc_document")
      : null,
  ]);

  const date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat("fr-FR", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "—";

  return (
    <div className="mx-auto w-full max-w-4xl">
      <BackLink href="/platform-admin/kyc" label="Retour aux dossiers" />

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-fg">
            {item.store?.name ?? "Boutique"}
          </h1>
          <p className="mt-1 text-[0.875rem] text-subtle">
            /{item.store?.slug ?? "—"} · soumis le {date(item.submitted_at)}
          </p>
        </div>
        <AdminStatusBadge status={item.status} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-3xl border border-border bg-surface p-5">
          <h2 className="text-[0.9375rem] font-medium text-fg">Identité déclarée</h2>
          <dl className="mt-3 space-y-2 text-[0.8125rem]">
            <div className="flex justify-between gap-3">
              <dt className="text-subtle">Nom</dt>
              <dd className="font-medium text-fg">{item.legal_name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-subtle">Naissance</dt>
              <dd className="text-body">
                {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                  new Date(item.birth_date),
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-subtle">Pays</dt>
              <dd className="text-body">{item.country}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-subtle">Document</dt>
              <dd className="text-body">
                {DOCUMENT_LABEL[item.document_type] ?? item.document_type}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-subtle">Numéro</dt>
              <dd className="font-mono text-body">•••• {item.document_last4}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-3xl border border-border bg-surface p-5">
          <h2 className="text-[0.9375rem] font-medium text-fg">Revue</h2>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
            Vérifie la netteté, la cohérence nom/date et la correspondance avec
            le selfie. Les documents expirent après quelques minutes.
          </p>
          {item.rejection_reason ? (
            <p className="mt-3 rounded-xl bg-amber-400/[0.08] px-3 py-2 text-[0.75rem] text-amber-700 dark:text-amber-300">
              Motif précédent : {item.rejection_reason}
            </p>
          ) : null}
          <AdminKycReview caseId={item.id} status={item.status} />
        </section>
      </div>

      <section className="mt-4 rounded-3xl border border-border bg-surface p-5">
        <h2 className="text-[0.9375rem] font-medium text-fg">Documents</h2>
        <KycDocumentViewer
          documents={[
            { label: "Recto", url: front },
            { label: "Verso", url: back },
            { label: "Selfie", url: selfie },
          ]}
        />
      </section>
    </div>
  );
}
