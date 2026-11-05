"use client";

import { useActionState } from "react";
import { Spinner } from "@/components/ui/primitives";
import {
  resetUserSecurityAction,
  setMerchantStatusAction,
  setStoreStatusAction,
  setUserStatusAction,
  removeAdminAction,
  type AdminActionResult,
} from "@/lib/platform/admin-actions";

const INITIAL: AdminActionResult = { status: "idle" };

export function AdminActionButton({
  kind,
  id,
  suspend,
  label,
  confirmLabel,
  tone = "neutral",
  variant = "default",
}: {
  kind: "merchant" | "store" | "user" | "reset" | "admin";
  id: string;
  suspend?: boolean;
  label: string;
  confirmLabel?: string;
  tone?: "neutral" | "danger" | "primary";
  variant?: "default" | "hero";
}) {
  const action =
    kind === "merchant"
      ? setMerchantStatusAction
      : kind === "store"
        ? setStoreStatusAction
        : kind === "user"
          ? setUserStatusAction
          : kind === "admin"
            ? removeAdminAction
            : resetUserSecurityAction;

  const [state, formAction, pending] = useActionState(action, INITIAL);

  const toneClass =
    variant === "hero"
      ? "border-white/35 bg-white/10 text-white hover:bg-white/20"
      : tone === "danger"
        ? "border-red-400/30 text-red-600 hover:bg-red-400/10 dark:text-red-400"
        : tone === "primary"
          ? "border-brand-500/40 text-accent hover:bg-brand-500/10"
          : "border-border text-body hover:border-border-strong";

  return (
    <form action={formAction} className="inline-flex flex-col items-start gap-1">
      <input
        type="hidden"
        name={kind === "store" ? "storeId" : "userId"}
        value={id}
      />
      {typeof suspend === "boolean" ? (
        <input type="hidden" name="suspend" value={String(suspend)} />
      ) : null}
      <button
        type="submit"
        disabled={pending}
        title={state.status === "error" ? state.message : confirmLabel ?? label}
        className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[0.6875rem] font-medium transition-colors disabled:opacity-50 ${toneClass}`}
      >
        {pending ? <Spinner /> : null}
        {state.status === "saved" ? "Fait" : label}
      </button>
      {state.status === "error" ? (
        <span className={`max-w-40 text-[0.625rem] leading-tight ${variant === "hero" ? "text-white/80" : "text-red-500"}`}>
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
