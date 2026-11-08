import type { Metadata } from "next";
import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import { reviewCourierAction } from "@/lib/couriers/actions";
import { adminCouriers } from "@/lib/couriers/queries";
import { signDownload } from "@/lib/r2/client";

export const metadata: Metadata = {
  title: "Pashove · Livreurs",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  approved: "Validé",
  rejected: "Refusé",
};

export default async function AdminCouriersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const couriers = await adminCouriers();

  const rows = await Promise.all(
    couriers.map(async (courier) => {
      const [idUrl, selfieUrl] = await Promise.all([
        signDownload(courier.idDocumentKey, "kyc_document", 600).catch(() => null),
        signDownload(courier.selfieKey, "kyc_document", 600).catch(() => null),
      ]);

      return { ...courier, idUrl, selfieUrl };
    }),
  );

  const pending = rows.filter((row) => row.status === "pending").length;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        Livreurs
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">
        Dossiers Pashove Delivery : pièce d’identité, selfie et décision.
      </p>

      <div className="mt-4 flex flex-wrap gap-3 text-[0.8125rem]">
        <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-subtle">
          {pending} en attente
        </span>
        <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-subtle">
          {rows.length} au total
        </span>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3.5 py-3 text-[0.8125rem] text-red-600 dark:text-red-400">
          {decodeURIComponent(error)}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border bg-surface px-5 py-8 text-center text-[0.875rem] text-subtle">
          Aucun dossier livreur pour le moment.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((courier) => (
            <li
              key={courier.id}
              className="rounded-3xl border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[0.9375rem] font-medium text-fg">
                    {courier.fullName}
                  </p>
                  <p className="mt-0.5 text-[0.8125rem] text-subtle">
                    {courier.email} · {courier.phone}
                    {courier.country ? ` · ${courier.country}` : ""}
                  </p>
                  <p className="mt-0.5 text-[0.6875rem] text-faint">
                    Déposé le{" "}
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(courier.createdAt))}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-medium ${
                    courier.status === "approved"
                      ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                      : courier.status === "rejected"
                        ? "bg-red-500/12 text-red-600 dark:text-red-400"
                        : "bg-amber-400/15 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {STATUS_LABEL[courier.status] ?? courier.status}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {courier.idUrl ? (
                  <Link
                    href={courier.idUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-[0.75rem] font-medium text-body transition-colors hover:border-border-strong"
                  >
                    <Icon path={icons.file} className="h-3.5 w-3.5" strokeWidth={1.8} />
                    Pièce d’identité
                  </Link>
                ) : (
                  <span className="text-[0.75rem] text-faint">
                    Pièce indisponible
                  </span>
                )}
                {courier.selfieUrl ? (
                  <Link
                    href={courier.selfieUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-[0.75rem] font-medium text-body transition-colors hover:border-border-strong"
                  >
                    <Icon path={icons.user} className="h-3.5 w-3.5" strokeWidth={1.8} />
                    Selfie
                  </Link>
                ) : null}
              </div>

              {courier.rejectionReason ? (
                <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-3 py-2 text-[0.75rem] text-red-600 dark:text-red-400">
                  Motif : {courier.rejectionReason}
                </p>
              ) : null}

              {courier.status !== "approved" ? (
                <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-hairline pt-4">
                  <form action={reviewCourierAction}>
                    <input type="hidden" name="id" value={courier.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-[0.75rem] font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                      <Icon path={icons.check} className="h-3.5 w-3.5" strokeWidth={2.4} />
                      Approuver
                    </button>
                  </form>

                  <form
                    action={reviewCourierAction}
                    className="flex flex-1 flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="id" value={courier.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <input
                      name="reason"
                      required
                      maxLength={300}
                      placeholder="Motif du refus"
                      className="h-9 min-w-[12rem] flex-1 rounded-full border border-border bg-bg px-4 text-[0.75rem] text-fg outline-none focus:border-brand-500"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-500/30 px-4 text-[0.75rem] font-medium text-red-600 transition-colors hover:bg-red-500/[0.06] dark:text-red-400"
                    >
                      Rejeter
                    </button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
