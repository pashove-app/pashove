"use client";

import { useActionState, useState } from "react";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import {
  saveDeliverySettingsAction,
  type DeliverySettingsState,
} from "@/lib/delivery/actions";

const INITIAL: DeliverySettingsState = { status: "idle" };

export function DeliverySettingsForm({
  mode,
  countries,
  options,
}: {
  mode: "self" | "pashove";
  countries: string[];
  options: { code: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<
    DeliverySettingsState,
    FormData
  >(saveDeliverySettingsAction, INITIAL);

  const [deliveryMode, setDeliveryMode] = useState<"self" | "pashove">(mode);
  const [selected, setSelected] = useState<string[]>(countries);

  function chooseMode(next: "self" | "pashove") {
    setDeliveryMode(next);
    if (next === "pashove" && selected.length === 0 && options[0]) {
      setSelected([options[0].code]);
    }
  }

  function toggleCountry(code: string) {
    setSelected((current) =>
      current.includes(code)
        ? current.filter((value) => value !== code)
        : [...current, code],
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="mode" value={deliveryMode} />

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">
          Mode de livraison
        </h2>
        <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
          Pashove Delivery sera proposé au checkout uniquement pour les pays
          desservis.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            {
              code: "self" as const,
              title: "Géré par moi-même",
              text: "Tu organises et livres tes commandes.",
              icon: "store" as const,
            },
            {
              code: "pashove" as const,
              title: "Pashove Delivery",
              text: "La plateforme trouve un livreur moto.",
              icon: "route" as const,
            },
          ].map((option) => {
            const active = deliveryMode === option.code;
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => chooseMode(option.code)}
                aria-pressed={active}
                className={`rounded-2xl border p-4 text-start transition-colors ${
                  active
                    ? "border-brand-500 bg-brand-500/[0.07]"
                    : "border-border bg-surface hover:border-border-strong"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    active ? "bg-brand-500 text-white" : "bg-hairline text-subtle"
                  }`}
                >
                  <Icon path={icons[option.icon]} className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <span className="mt-3 block text-[0.875rem] font-medium text-fg">
                  {option.title}
                </span>
                <span className="mt-0.5 block text-[0.75rem] leading-relaxed text-subtle">
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section
        className={`rounded-3xl border border-border bg-surface p-5 sm:p-6 ${
          deliveryMode === "pashove" ? "" : "opacity-50"
        }`}
      >
        <h2 className="text-[0.9375rem] font-medium text-fg">
          Zones desservies
        </h2>
        <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
          Seuls les pays activés dans tes pays de vente peuvent être desservis.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const active = selected.includes(option.code);
            return (
              <label
                key={option.code}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${
                  deliveryMode !== "pashove"
                    ? "cursor-not-allowed border-border bg-bg"
                    : active
                      ? "cursor-pointer border-brand-500 bg-brand-500/[0.07]"
                      : "cursor-pointer border-border bg-surface hover:border-border-strong"
                }`}
              >
                <input
                  type="checkbox"
                  name="countries"
                  value={option.code}
                  checked={active}
                  disabled={deliveryMode !== "pashove"}
                  onChange={() => toggleCountry(option.code)}
                  className="h-4 w-4 accent-[var(--brand-500)]"
                />
                <span className="text-[0.8125rem] font-medium text-fg">
                  {option.name}
                </span>
              </label>
            );
          })}
        </div>

        {deliveryMode === "pashove" ? (
          <p className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-amber-700 dark:text-amber-300">
            Le dispatch automatique et le code de livraison arrivent au lot L2b.
            En attendant, tu peux enregistrer ton choix.
          </p>
        ) : null}
      </section>

      {state.message ? (
        <p
          role="status"
          className={`rounded-xl border px-3 py-2.5 text-[0.75rem] ${
            state.status === "saved"
              ? "border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-700 dark:text-emerald-300"
              : "border-red-500/25 bg-red-500/[0.06] text-red-600 dark:text-red-400"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-[0.875rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
      >
        {pending ? <Spinner /> : null}
        Enregistrer
      </button>
    </form>
  );
}
