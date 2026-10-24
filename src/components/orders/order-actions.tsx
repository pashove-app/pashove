"use client";

import { useActionState, useState } from "react";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/i18n/get-dictionary";
import {
  advanceOrderAction,
  cancelOrderAction,
  markOrderPaidAction,
  refundOrderAction,
  type OrderActionState,
} from "@/lib/orders/actions";
import type {
  OrderPaymentStatus,
  OrderStatus,
} from "@/lib/orders/queries";

type Labels = Dictionary["dashboard"]["orders"];

const INITIAL_ORDER_ACTION_STATE: OrderActionState = { status: "idle" };

const NEXT: Partial<Record<OrderStatus, keyof Labels>> = {
  pending: "confirmOrder",
  confirmed: "prepareOrder",
  processing: "shipOrder",
  shipped: "deliverOrder",
};

const messageOf = (
  state: OrderActionState,
  labels: Labels,
): string | null => {
  if (state.status === "idle" || !state.messageKey) return null;
  return labels[state.messageKey as keyof Labels] ?? null;
};

const BUTTON =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-[0.75rem] font-medium transition-colors disabled:opacity-60";
const PRIMARY = "bg-brand-500 text-white hover:bg-brand-600";
const OUTLINE =
  "border border-border bg-surface text-body hover:border-border-strong hover:text-fg";
const DANGER =
  "border border-red-400/30 bg-red-400/[0.06] text-red-600 hover:bg-red-400/10 dark:text-red-400";

/** Barre d'actions de la fiche commande. */
export function OrderActions({
  orderId,
  status,
  paymentStatus,
  paymentMethod,
  labels,
}: {
  orderId: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentMethod: string;
  labels: Labels;
}) {
  const [advanceState, advance, advancing] = useActionState(
    advanceOrderAction,
    INITIAL_ORDER_ACTION_STATE,
  );
  const [paidState, markPaid, paying] = useActionState(
    markOrderPaidAction,
    INITIAL_ORDER_ACTION_STATE,
  );
  const [cancelState, cancel, cancelling] = useActionState(
    cancelOrderAction,
    INITIAL_ORDER_ACTION_STATE,
  );
  const [refundState, refund, refunding] = useActionState(
    refundOrderAction,
    INITIAL_ORDER_ACTION_STATE,
  );

  const [shipOpen, setShipOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const nextKey = NEXT[status];
  const canPay =
    paymentMethod === "cod" &&
    paymentStatus === "pending" &&
    status !== "cancelled";
  const canCancel =
    (status === "pending" || status === "confirmed" || status === "processing") &&
    paymentStatus !== "paid";
  const canRefund =
    paymentMethod === "cod" &&
    paymentStatus === "paid" &&
    status !== "cancelled";

  const active =
    advanceState.status !== "idle"
      ? advanceState
      : paidState.status !== "idle"
        ? paidState
        : cancelState.status !== "idle"
          ? cancelState
          : refundState.status !== "idle"
            ? refundState
            : null;

  const message = active ? messageOf(active, labels) : null;
  const isError = active?.status === "error";

  if (!nextKey && !canPay && !canCancel && !canRefund && !message) return null;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="me-1 text-[0.9375rem] font-medium text-fg">
          {labels.actionsTitle}
        </h2>

        {nextKey ? (
          nextKey === "shipOrder" ? (
            <button
              type="button"
              onClick={() => setShipOpen(true)}
              className={cn(BUTTON, PRIMARY)}
            >
              {labels.shipOrder}
              <Icon path={icons.arrowRight} className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={2} />
            </button>
          ) : (
            <form action={advance}>
              <input type="hidden" name="orderId" value={orderId} />
              <button type="submit" disabled={advancing} className={cn(BUTTON, PRIMARY)}>
                {advancing ? <Spinner /> : null}
                {labels[nextKey]}
              </button>
            </form>
          )
        ) : null}

        {canPay ? (
          <form action={markPaid}>
            <input type="hidden" name="orderId" value={orderId} />
            <button type="submit" disabled={paying} className={cn(BUTTON, OUTLINE)}>
              {paying ? <Spinner /> : null}
              {labels.markPaid}
            </button>
          </form>
        ) : null}

        {canCancel ? (
          <button
            type="button"
            onClick={() => setCancelOpen(true)}
            className={cn(BUTTON, DANGER)}
          >
            {labels.cancelButton}
          </button>
        ) : null}

        {canRefund ? (
          <button
            type="button"
            onClick={() => setRefundOpen(true)}
            className={cn(BUTTON, DANGER)}
          >
            {labels.refundButton}
          </button>
        ) : null}
      </div>

      {shipOpen && status === "processing" ? (
        <form
          action={advance}
          className="mt-4 rounded-xl border border-border bg-hairline/30 p-4"
        >
          <input type="hidden" name="orderId" value={orderId} />

          <label
            htmlFor="order-tracking"
            className="block text-[0.75rem] font-medium text-body"
          >
            {labels.trackingLabel}
          </label>
          <input
            id="order-tracking"
            name="tracking"
            dir="ltr"
            maxLength={100}
            autoComplete="off"
            placeholder={labels.trackingPlaceholder}
            className="mt-2 h-10 w-full rounded-lg border border-border bg-surface px-3 text-[0.8125rem] text-fg placeholder:text-faint focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
          />
          <p className="mt-1.5 text-[0.6875rem] text-subtle">
            {labels.trackingHelp}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="submit" disabled={advancing} className={cn(BUTTON, PRIMARY)}>
              {advancing ? <Spinner /> : null}
              {labels.shipSubmit}
            </button>
            <button
              type="button"
              onClick={() => setShipOpen(false)}
              className={cn(BUTTON, OUTLINE)}
            >
              {labels.shipCancel}
            </button>
          </div>
        </form>
      ) : null}

      {cancelOpen && canCancel ? (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/[0.06] p-4">
          <p className="text-[0.8125rem] font-medium text-red-600 dark:text-red-400">
            {labels.cancelConfirmTitle}
          </p>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-muted">
            {labels.cancelConfirmText}
          </p>

          <form action={cancel} className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="orderId" value={orderId} />
            <button
              type="submit"
              disabled={cancelling}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3.5 text-[0.75rem] font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {cancelling ? <Spinner /> : null}
              {labels.cancelYes}
            </button>
            <button
              type="button"
              onClick={() => setCancelOpen(false)}
              className={cn(BUTTON, OUTLINE)}
            >
              {labels.cancelNo}
            </button>
          </form>
        </div>
      ) : null}

      {refundOpen && canRefund ? (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/[0.06] p-4">
          <p className="text-[0.8125rem] font-medium text-red-600 dark:text-red-400">
            {labels.refundConfirmTitle}
          </p>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-muted">
            {labels.refundConfirmText}
          </p>

          <form action={refund} className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="orderId" value={orderId} />
            <button
              type="submit"
              disabled={refunding}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3.5 text-[0.75rem] font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {refunding ? <Spinner /> : null}
              {labels.refundYes}
            </button>
            <button
              type="button"
              onClick={() => setRefundOpen(false)}
              className={cn(BUTTON, OUTLINE)}
            >
              {labels.refundNo}
            </button>
          </form>
        </div>
      ) : null}

      {message ? (
        <p
          role={isError ? "alert" : "status"}
          className={cn(
            "mt-3 text-[0.75rem] font-medium",
            isError ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
