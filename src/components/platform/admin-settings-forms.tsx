"use client";

import { useActionState } from "react";
import { Spinner } from "@/components/ui/primitives";
import {
  addAdminAction,
  removeAdminAction,
  savePlanAction,
  saveSettingAction,
  type AdminActionResult,
} from "@/lib/platform/admin-actions";
import type {
  AdminPlan,
  AdminPlatformAdmin,
} from "@/lib/platform/admin-types";

const INITIAL: AdminActionResult = { status: "idle" };

const INPUT =
  "h-9 w-full rounded-lg border border-border bg-bg px-2.5 text-[0.75rem] text-fg outline-none transition-colors focus:border-brand-500";

const SETTING_LABEL: Record<string, { title: string; text: string }> = {
  store_signup_enabled: {
    title: "Ouverture de nouvelles boutiques",
    text: "Autoriser la création de nouvelles boutiques sur la plateforme.",
  },
  payments_enabled: {
    title: "Paiements",
    text: "Activer les moyens de paiement pour les boutiques.",
  },
  gifts_enabled: {
    title: "Cadeaux",
    text: "Autoriser l’option cadeau au checkout.",
  },
};

export function PlanEditor({ plan }: { plan: AdminPlan }) {
  const [state, action, pending] = useActionState(savePlanAction, INITIAL);

  return (
    <form action={action} className="rounded-2xl border border-border bg-surface p-4">
      <input type="hidden" name="code" value={plan.code} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.875rem] font-medium text-fg">{plan.name}</p>
          <p className="text-[0.6875rem] text-faint">{plan.code}</p>
        </div>
        <span className="text-[0.6875rem] text-subtle">{plan.currency}</span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-[0.625rem] uppercase tracking-[0.1em] text-faint">
            Nom
          </span>
          <input name="name" defaultValue={plan.name} className={`${INPUT} mt-1`} />
        </label>
        <label className="block">
          <span className="text-[0.625rem] uppercase tracking-[0.1em] text-faint">
            Commission (bps)
          </span>
          <input
            name="commissionBps"
            type="number"
            min={0}
            max={10000}
            defaultValue={plan.commissionBps}
            className={`${INPUT} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[0.625rem] uppercase tracking-[0.1em] text-faint">
            Boutiques max
          </span>
          <input
            name="maxStores"
            type="number"
            min={1}
            defaultValue={plan.maxStores}
            className={`${INPUT} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[0.625rem] uppercase tracking-[0.1em] text-faint">
            Membres max
          </span>
          <input
            name="maxMembers"
            type="number"
            min={1}
            defaultValue={plan.maxMembers}
            className={`${INPUT} mt-1`}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[0.625rem] uppercase tracking-[0.1em] text-faint">
            Prix mensuel
          </span>
          <input
            name="priceAmount"
            type="number"
            min={0}
            defaultValue={plan.priceAmount}
            className={`${INPUT} mt-1`}
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-500 px-3 text-[0.6875rem] font-medium text-white disabled:opacity-60"
        >
          {pending ? <Spinner /> : null}
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {state.status === "saved" ? (
          <span className="text-[0.6875rem] text-emerald-600 dark:text-emerald-400">
            Enregistré
          </span>
        ) : null}
        {state.status === "error" ? (
          <span className="text-[0.6875rem] text-red-500">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}

export function SettingsToggles({
  settings,
}: {
  settings: Record<string, boolean>;
}) {
  return (
    <div className="space-y-2">
      {Object.entries(SETTING_LABEL).map(([key, copy]) => (
        <SettingToggle
          key={key}
          settingKey={key}
          title={copy.title}
          text={copy.text}
          enabled={settings[key] !== false}
        />
      ))}
    </div>
  );
}

function SettingToggle({
  settingKey,
  title,
  text,
  enabled,
}: {
  settingKey: string;
  title: string;
  text: string;
  enabled: boolean;
}) {
  const [state, action, pending] = useActionState(saveSettingAction, INITIAL);

  return (
    <form
      action={action}
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4"
    >
      <input type="hidden" name="key" value={settingKey} />
      <input type="hidden" name="enabled" value={String(!enabled)} />
      <div className="min-w-0">
        <p className="text-[0.8125rem] font-medium text-fg">{title}</p>
        <p className="mt-0.5 text-[0.6875rem] text-subtle">{text}</p>
      </div>
      <div className="flex items-center gap-2">
        {state.status === "error" ? (
          <span className="text-[0.625rem] text-red-500">{state.message}</span>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[0.6875rem] font-medium ${
            enabled
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-400"
              : "border-border text-subtle"
          }`}
        >
          {pending ? <Spinner /> : null}
          {enabled ? "Activé" : "Désactivé"}
        </button>
      </div>
    </form>
  );
}

export function AdminAccounts({
  admins,
}: {
  admins: AdminPlatformAdmin[];
}) {
  const [state, action, pending] = useActionState(addAdminAction, INITIAL);

  return (
    <div className="space-y-3">
      <form action={action} className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-[0.8125rem] font-medium text-fg">
          Ajouter un accès plateforme
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_10rem_auto]">
          <input
            name="email"
            type="email"
            placeholder="email@pashove.com"
            className={INPUT}
          />
          <select name="role" defaultValue="admin" className={INPUT}>
            <option value="admin">Admin</option>
            <option value="auditor">Auditeur</option>
            <option value="super_admin">Super admin</option>
          </select>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 text-[0.75rem] font-medium text-white disabled:opacity-60"
          >
            {pending ? <Spinner /> : null}
            Ajouter
          </button>
        </div>
        {state.status === "error" ? (
          <p className="mt-2 text-[0.6875rem] text-red-500">{state.message}</p>
        ) : null}
      </form>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {admins.map((admin) => (
          <div
            key={admin.userId}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3 last:border-0"
          >
            <div>
              <p className="text-[0.8125rem] font-medium text-fg">{admin.name}</p>
              <p className="text-[0.6875rem] text-subtle">{admin.email}</p>
            </div>
            <span className="rounded-full border border-border px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-wide text-subtle">
              {admin.role.replace("_", " ")}
            </span>
            <RemoveAdmin userId={admin.userId} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RemoveAdmin({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(removeAdminAction, INITIAL);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className="text-[0.6875rem] font-medium text-red-500 hover:underline disabled:opacity-50"
      >
        {pending ? "…" : "Retirer"}
      </button>
      {state.status === "error" ? (
        <span className="text-[0.625rem] text-red-500">{state.message}</span>
      ) : null}
    </form>
  );
}
