"use client";

import { useActionState, useState } from "react";
import { buttonClass, Icon, icons, Spinner } from "@/components/ui/primitives";
import { TextField } from "@/components/ui/field";
import type { Locale } from "@/i18n/config";
import {
  addDomainAction,
  removeDomainAction,
  verifyDomainAction,
} from "@/lib/domains/actions";
import { INITIAL_DOMAIN_STATE } from "@/lib/domains/state";
import type { StoreDomain } from "@/lib/domains/queries";

type Props = {
  locale: Locale;
  freeHost: string;
  storeSlug: string;
  domain: StoreDomain | null;
  owner: boolean;
  configured: boolean;
  reservedSubdomain: boolean;
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Presse-papiers indisponible : la valeur reste sélectionnable à l'écran.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-[0.6875rem] font-medium text-subtle transition-colors hover:border-border-strong hover:text-fg"
    >
      <Icon
        path={copied ? icons.check : icons.copy}
        className="h-3.5 w-3.5"
        strokeWidth={2}
      />
      {copied ? "Copié" : "Copier"}
    </button>
  );
}

function DnsRow({
  type,
  name,
  value,
}: {
  type: string;
  name: string;
  value: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-bg px-3 py-2.5">
      <div className="min-w-0">
        <span className="mr-2 rounded-md bg-hairline px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-subtle">
          {type}
        </span>
        <span className="text-[0.75rem] font-medium text-fg">{name}</span>
        <p className="mt-0.5 break-all font-mono text-[0.6875rem] text-subtle">
          {value}
        </p>
      </div>
      <CopyButton value={value} />
    </div>
  );
}

/**
 * Réglages du domaine : adresse Pashove incluse et domaine personnalisé vérifié
 * par enregistrement DNS. Aucun appel Vercel n'est fait depuis le navigateur.
 */
export function DomainSettings({
  locale,
  freeHost,
  storeSlug,
  domain,
  owner,
  configured,
  reservedSubdomain,
}: Props) {
  const [state, formAction, pending] = useActionState(
    addDomainAction,
    INITIAL_DOMAIN_STATE,
  );

  const apex = domain
    ? domain.apexName
      ? domain.domain === domain.apexName
      : domain.domain.split(".").length === 2
    : false;

  const aValue = domain?.dns?.ipv4[0] ?? "76.76.21.21";
  const cnameValue = domain?.dns?.cname[0] ?? "cname.vercel-dns.com";
  const recordName = domain
    ? apex
      ? "@"
      : domain.domain.split(".")[0]
    : "";

  return (
    <div className="mt-8 space-y-4">
      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">
              Adresse Pashove incluse
            </p>
            <h2 className="mt-1 text-[1.0625rem] font-medium text-fg">
              {freeHost}
            </h2>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
              Toujours disponible, même quand un domaine personnalisé est
              connecté.
            </p>
          </div>
          <CopyButton value={`https://${freeHost}`} />
        </div>

        {reservedSubdomain ? (
          <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/[0.08] px-3 py-2.5 text-[0.75rem] leading-relaxed text-amber-700 dark:text-amber-300">
            Le slug « {storeSlug} » est réservé par la plateforme : le
            sous-domaine n’est pas disponible. La vitrine reste accessible via
            pashove.com.
          </p>
        ) : null}
      </section>

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">
          Domaine personnalisé
        </p>

        {!owner ? (
          <p className="mt-3 text-[0.875rem] leading-relaxed text-subtle">
            Seul le propriétaire de la boutique peut connecter un domaine.
          </p>
        ) : !configured ? (
          <p className="mt-3 text-[0.875rem] leading-relaxed text-subtle">
            Les domaines personnalisés ne sont pas encore activés sur cette
            plateforme. Contacte le support Pashove.
          </p>
        ) : domain ? (
          <>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="break-all text-[1.0625rem] font-medium text-fg">
                  {domain.domain}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-[0.75rem] text-subtle">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      domain.status === "verified" ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                  />
                  {domain.status === "verified"
                    ? "Actif · certificat SSL automatique"
                    : "En attente de configuration DNS"}
                </p>
              </div>
              {domain.status === "verified" ? (
                <a
                  href={`https://${domain.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-[0.75rem] font-medium text-body transition-colors hover:border-border-strong"
                >
                  Ouvrir
                  <Icon path={icons.arrowRight} className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>

            {domain.status !== "verified" ? (
              <div className="mt-5 space-y-3">
                <p className="text-[0.8125rem] leading-relaxed text-subtle">
                  Ajoute ces enregistrements chez ton registrar (le service où
                  tu as acheté le domaine). La propagation peut prendre quelques
                  minutes.
                </p>

                {apex ? (
                  <DnsRow type="A" name={recordName} value={aValue} />
                ) : (
                  <DnsRow type="CNAME" name={recordName} value={cnameValue} />
                )}

                {domain.verification.map((record, index) => (
                  <DnsRow
                    key={`${record.type}-${record.domain}-${index}`}
                    type={record.type.toUpperCase()}
                    name={record.domain}
                    value={record.value}
                  />
                ))}

                {apex ? (
                  <p className="text-[0.6875rem] leading-relaxed text-faint">
                    Pour faire répondre aussi www.{domain.domain}, ajoute-le
                    comme redirection chez ton registrar ou contacte le support.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-emerald-700 dark:text-emerald-300">
                Ton domaine sert directement la vitrine. Le certificat SSL est
                renouvelé automatiquement.
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              {domain.status !== "verified" ? (
                <form action={verifyDomainAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <button type="submit" className={buttonClass({ size: "sm" })}>
                    Vérifier maintenant
                  </button>
                </form>
              ) : null}

              <form
                action={removeDomainAction}
                onSubmit={(event) => {
                  if (
                    !window.confirm(
                      `Supprimer le domaine ${domain.domain} ? La vitrine restera accessible sur l’adresse Pashove.`,
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="inline-flex h-9 items-center rounded-full border border-border px-4 text-[0.75rem] font-medium text-subtle transition-colors hover:border-red-300 hover:text-red-600"
                >
                  Supprimer
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-subtle">
              Connecte ton nom de domaine pour vendre sous ta propre adresse.
              La vérification est faite chez Vercel, sans intervention de ta
              part côté certificat.
            </p>

            <form action={formAction} className="mt-5 space-y-4">
              <input type="hidden" name="locale" value={locale} />
              <TextField
                name="domain"
                label="Ton domaine"
                hint="maboutique.com ou boutique.maboutique.com"
                placeholder="maboutique.com"
                inputMode="url"
                autoComplete="url"
                dir="ltr"
              />

              {state.status === "error" && state.message ? (
                <p
                  role="alert"
                  className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-red-600 dark:text-red-400"
                >
                  {state.message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className={buttonClass({ size: "lg", className: "w-full sm:w-auto" })}
              >
                {pending ? <Spinner /> : null}
                {pending ? "Connexion…" : "Connecter le domaine"}
              </button>
            </form>

            <ol className="mt-6 grid gap-3 text-[0.75rem] leading-relaxed text-subtle sm:grid-cols-3">
              <li className="rounded-2xl border border-border bg-bg p-3.5">
                <span className="font-semibold text-fg">1.</span> Saisis ton
                domaine.
              </li>
              <li className="rounded-2xl border border-border bg-bg p-3.5">
                <span className="font-semibold text-fg">2.</span> Ajoute les
                enregistrements DNS affichés.
              </li>
              <li className="rounded-2xl border border-border bg-bg p-3.5">
                <span className="font-semibold text-fg">3.</span> Clique sur
                Vérifier : le SSL se met en place seul.
              </li>
            </ol>
          </>
        )}

        {state.status === "success" && state.message ? (
          <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-emerald-700 dark:text-emerald-300">
            {state.message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
