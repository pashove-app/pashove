"use client";

import { useActionState, useState } from "react";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import { TextField } from "@/components/ui/field";
import {
  saveCheckoutSettingsAction,
  type CheckoutSettingsState,
} from "@/lib/checkout/actions";
import type {
  CheckoutBlockKey,
  CheckoutPreset,
  CheckoutSettings,
} from "@/lib/checkout/settings";

const INITIAL: CheckoutSettingsState = { status: "idle" };

const BLOCK_LABELS: Record<CheckoutBlockKey, string> = {
  contact: "Contact",
  delivery: "Livraison",
  gift: "Cadeau",
  summary: "Récapitulatif",
  payment: "Paiement",
};

const BLOCK_HINTS: Record<CheckoutBlockKey, string> = {
  contact: "Nom, e-mail, téléphone, création de compte",
  delivery: "Pays, ville, adresse, note",
  gift: "Achat cadeau et date d'envoi",
  summary: "Articles, remise, livraison, total",
  payment: "Moyens de paiement et champs associés",
};

export function CheckoutSettingsForm({
  locale,
  settings,
  defaults,
}: {
  locale: string;
  settings: CheckoutSettings;
  defaults: { title: string; subtitle: string; payLabel: string };
}) {
  const [state, formAction, pending] = useActionState<
    CheckoutSettingsState,
    FormData
  >(saveCheckoutSettingsAction, INITIAL);

  const [preset, setPreset] = useState<CheckoutPreset>(settings.preset);
  const [blocks, setBlocks] = useState<CheckoutBlockKey[]>(settings.blocks);

  const current = settings.texts[locale] ?? {};

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="preset" value={preset} />
      <input type="hidden" name="texts" value={JSON.stringify(settings.texts)} />
      {blocks.map((key) => (
        <input key={key} type="hidden" name="blocks" value={key} />
      ))}

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">Modèle</h2>
        <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
          La disposition reste responsive sur mobile dans tous les cas.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(
            [
              {
                code: "compact" as const,
                title: "Compact",
                text: "Une seule colonne, blocs rapprochés.",
              },
              {
                code: "detailed" as const,
                title: "Détaillé",
                text: "Blocs plus espacés, lecture posée.",
              },
            ]
          ).map((entry) => {
            const active = preset === entry.code;
            return (
              <button
                key={entry.code}
                type="button"
                onClick={() => setPreset(entry.code)}
                aria-pressed={active}
                className={`rounded-2xl border p-4 text-start transition-colors ${
                  active
                    ? "border-brand-500 bg-brand-500/[0.07]"
                    : "border-border bg-surface hover:border-border-strong"
                }`}
              >
                <span className="block text-[0.875rem] font-medium text-fg">
                  {entry.title}
                </span>
                <span className="mt-0.5 block text-[0.75rem] leading-relaxed text-subtle">
                  {entry.text}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">Ordre des blocs</h2>
        <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
          Utilise les flèches pour déplacer un bloc. « Paiement » reste toujours
          présent.
        </p>

        <ol className="mt-4 space-y-2">
          {blocks.map((key, index) => (
            <li
              key={key}
              className="flex items-center gap-3 rounded-2xl border border-border bg-bg px-3 py-2.5"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-hairline text-[0.6875rem] font-semibold text-subtle">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.8125rem] font-medium text-fg">
                  {BLOCK_LABELS[key]}
                </span>
                <span className="block text-[0.6875rem] text-subtle">
                  {BLOCK_HINTS[key]}
                </span>
              </span>
              <span className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Monter ${BLOCK_LABELS[key]}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-subtle disabled:opacity-30"
                >
                  <Icon path={icons.arrowUp} className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === blocks.length - 1}
                  aria-label={`Descendre ${BLOCK_LABELS[key]}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-subtle disabled:opacity-30"
                >
                  <Icon path={icons.chevronDown} className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">Textes</h2>
        <p className="mt-1 text-[0.75rem] leading-relaxed text-subtle">
          Laisse vide pour utiliser le libellé par défaut de la langue.
        </p>

        <div className="mt-4 space-y-4">
          <TextField
            name="title"
            label="Titre de la page"
            maxLength={120}
            defaultValue={current.title ?? ""}
            placeholder={defaults.title}
          />
          <TextField
            name="subtitle"
            label="Sous-titre"
            maxLength={240}
            defaultValue={current.subtitle ?? ""}
            placeholder={defaults.subtitle}
          />
          <TextField
            name="payLabel"
            label="Libellé du bouton"
            maxLength={40}
            defaultValue={current.payLabel ?? ""}
            placeholder={defaults.payLabel}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">Options</h2>

        <div className="mt-4 space-y-3">
          <label className="flex items-start gap-3 rounded-2xl border border-border bg-bg px-3 py-3">
            <input
              type="checkbox"
              name="showGift"
              defaultChecked={settings.showGift}
              className="mt-0.5 h-4 w-4 accent-[var(--brand-500)]"
            />
            <span>
              <span className="block text-[0.8125rem] font-medium text-fg">
                Proposer l’achat cadeau
              </span>
              <span className="block text-[0.6875rem] text-subtle">
                Masqué si un article n’est pas éligible.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-border bg-bg px-3 py-3">
            <input
              type="checkbox"
              name="showDiscount"
              defaultChecked={settings.showDiscount}
              className="mt-0.5 h-4 w-4 accent-[var(--brand-500)]"
            />
            <span>
              <span className="block text-[0.8125rem] font-medium text-fg">
                Afficher le champ code promo
              </span>
              <span className="block text-[0.6875rem] text-subtle">
                Le champ reste ignoré si la boutique n’a aucun code actif.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-border bg-bg p-5">
        <p className="flex items-start gap-2 text-[0.75rem] leading-relaxed text-subtle">
          <Icon path={icons.lock} className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span>
            <span className="font-medium text-body">
              Les pays et les moyens de paiement sont verrouillés.
            </span>{" "}
            Pashove affiche les réseaux réellement disponibles dans le pays de
            la boutique, avec leurs logos officiels. Le marchand ne peut ni les
            ajouter, ni les retirer, ni modifier leurs visuels.
          </span>
        </p>
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
