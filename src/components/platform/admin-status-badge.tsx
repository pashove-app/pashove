import { cn } from "@/lib/cn";

const KYC_LABEL: Record<string, string> = {
  submitted: "À vérifier",
  under_review: "En revue",
  approved: "Approuvé",
  rejected: "Rejeté",
  resubmission_required: "À corriger",
  expired: "Expiré",
  not_started: "Non commencé",
};

const PAYOUT_LABEL: Record<string, string> = {
  requested: "Demandé",
  security_check: "Vérification",
  processing: "En traitement",
  sent: "Envoyé",
  completed: "Terminé",
  failed: "Échoué",
  reversed: "Reversé",
  cancelled: "Annulé",
};

function tone(status: string): string {
  if (["approved", "completed"].includes(status)) {
    return "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400";
  }
  if (["rejected", "failed"].includes(status)) {
    return "bg-red-500/12 text-red-600 dark:text-red-400";
  }
  if (["submitted", "requested", "security_check"].includes(status)) {
    return "bg-amber-500/12 text-amber-600 dark:text-amber-400";
  }
  if (["under_review", "processing"].includes(status)) {
    return "bg-blue-500/12 text-blue-600 dark:text-blue-400";
  }
  if (["sent"].includes(status)) {
    return "bg-violet-500/12 text-violet-600 dark:text-violet-400";
  }
  return "bg-hairline text-subtle";
}

export function AdminStatusBadge({
  status,
  kind = "kyc",
}: {
  status: string;
  kind?: "kyc" | "payout";
}) {
  const label = (kind === "kyc" ? KYC_LABEL : PAYOUT_LABEL)[status] ?? status;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium",
        tone(status),
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}
