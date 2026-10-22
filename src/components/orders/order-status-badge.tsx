import { cn } from "@/lib/cn";
import type { Dictionary } from "@/i18n/get-dictionary";
import type {
  OrderPaymentStatus,
  OrderStatus,
} from "@/lib/orders/queries";

const STATUS_KEY: Record<OrderStatus, keyof Dictionary["dashboard"]["orders"]> = {
  pending: "statusPending",
  confirmed: "statusConfirmed",
  processing: "statusProcessing",
  shipped: "statusShipped",
  delivered: "statusDelivered",
  cancelled: "statusCancelled",
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending:
    "border-amber-400/25 bg-amber-400/10 text-amber-700 dark:text-amber-300",
  confirmed:
    "border-blue-400/25 bg-blue-400/10 text-blue-700 dark:text-blue-300",
  processing:
    "border-indigo-400/25 bg-indigo-400/10 text-indigo-700 dark:text-indigo-300",
  shipped:
    "border-violet-400/25 bg-violet-400/10 text-violet-700 dark:text-violet-300",
  delivered:
    "border-emerald-400/25 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300",
  cancelled: "border-border-soft bg-hairline text-subtle",
};

export function orderStatusLabel(status: OrderStatus, t: Dictionary): string {
  return t.dashboard.orders[STATUS_KEY[status]];
}

export function OrderStatusBadge({
  status,
  t,
}: {
  status: OrderStatus;
  t: Dictionary;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium",
        STATUS_STYLE[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {t.dashboard.orders[STATUS_KEY[status]]}
    </span>
  );
}

const PAYMENT_STYLE: Record<OrderPaymentStatus, string> = {
  pending: "text-amber-700 dark:text-amber-300",
  paid: "text-emerald-700 dark:text-emerald-300",
  refunded: "text-subtle",
  failed: "text-red-600 dark:text-red-400",
};

const PAYMENT_KEY: Record<
  OrderPaymentStatus,
  keyof Dictionary["dashboard"]["orders"]
> = {
  pending: "paymentPending",
  paid: "paymentPaid",
  refunded: "paymentRefunded",
  failed: "paymentFailed",
};

export function PaymentStatus({
  status,
  t,
}: {
  status: OrderPaymentStatus;
  t: Dictionary;
}) {
  return (
    <span className={cn("text-[0.75rem] font-medium", PAYMENT_STYLE[status])}>
      {t.dashboard.orders[PAYMENT_KEY[status]]}
    </span>
  );
}
