import { cn } from "@/lib/cn";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { PayoutStatus } from "@/lib/finance/queries";

type FinanceLabelKey = Exclude<
  keyof Dictionary["dashboard"]["finance"],
  "errors"
>;

const STATUS_KEY: Record<PayoutStatus, FinanceLabelKey> = {
  requested: "payoutStatusRequested",
  security_check: "payoutStatusSecurityCheck",
  processing: "payoutStatusProcessing",
  sent: "payoutStatusSent",
  completed: "payoutStatusCompleted",
  failed: "payoutStatusFailed",
  reversed: "payoutStatusReversed",
  cancelled: "payoutStatusCancelled",
};

const STATUS_STYLE: Record<PayoutStatus, string> = {
  requested: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
  security_check: "bg-blue-500/12 text-blue-600 dark:text-blue-400",
  processing: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-400",
  sent: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
  completed: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  failed: "bg-red-500/12 text-red-600 dark:text-red-400",
  reversed: "bg-hairline text-subtle",
  cancelled: "bg-hairline text-subtle",
};

export function PayoutStatusBadge({
  status,
  t,
}: {
  status: PayoutStatus;
  t: Dictionary;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium",
        STATUS_STYLE[status],
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {t.dashboard.finance[STATUS_KEY[status]]}
    </span>
  );
}
