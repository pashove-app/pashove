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

const COPY = {
  fr: {
    copy: "Copier",
    copied: "Copié",
    freeEyebrow: "Adresse Pashove incluse",
    freeNote:
      "Toujours disponible, même quand un domaine personnalisé est connecté.",
    reserved:
      "Le slug « {slug} » est réservé par la plateforme : le sous-domaine n’est pas disponible. La vitrine reste accessible via pashove.com.",
    customEyebrow: "Domaine personnalisé",
    ownerOnly: "Seul le propriétaire de la boutique peut connecter un domaine.",
    notConfigured:
      "Les domaines personnalisés ne sont pas encore activés sur cette plateforme. Contacte le support Pashove.",
    active: "Actif · certificat SSL automatique",
    pending: "En attente de configuration DNS",
    open: "Ouvrir",
    dnsIntro:
      "Ajoute ces enregistrements chez ton registrar (le service où tu as acheté le domaine). La propagation peut prendre quelques minutes.",
    apexNote:
      "Pour faire répondre aussi www.{domain}, ajoute-le comme redirection chez ton registrar ou contacte le support.",
    verifiedNote:
      "Ton domaine sert directement la vitrine. Le certificat SSL est renouvelé automatiquement.",
    verify: "Vérifier maintenant",
    remove: "Supprimer",
    removeConfirm:
      "Supprimer le domaine {domain} ? La vitrine restera accessible sur l’adresse Pashove.",
    addIntro:
      "Connecte ton nom de domaine pour vendre sous ta propre adresse. La vérification est faite chez Vercel, sans intervention de ta part côté certificat.",
    domainLabel: "Ton domaine",
    domainHint: "maboutique.com ou boutique.maboutique.com",
    connect: "Connecter le domaine",
    connecting: "Connexion…",
    step1: "Saisis ton domaine.",
    step2: "Ajoute les enregistrements DNS affichés.",
    step3: "Clique sur Vérifier : le SSL se met en place seul.",
  },
  en: {
    copy: "Copy",
    copied: "Copied",
    freeEyebrow: "Included Pashove address",
    freeNote: "Always available, even when a custom domain is connected.",
    reserved:
      "The “{slug}” slug is reserved by the platform: the subdomain is unavailable. Your storefront remains available on pashove.com.",
    customEyebrow: "Custom domain",
    ownerOnly: "Only the store owner can connect a domain.",
    notConfigured:
      "Custom domains are not enabled on this platform yet. Contact Pashove support.",
    active: "Active · automatic SSL certificate",
    pending: "Waiting for DNS configuration",
    open: "Open",
    dnsIntro:
      "Add these records at your registrar (the service where you bought the domain). Propagation may take a few minutes.",
    apexNote:
      "To answer on www.{domain} as well, add it as a redirect at your registrar or contact support.",
    verifiedNote:
      "Your domain serves the storefront directly. The SSL certificate renews automatically.",
    verify: "Check now",
    remove: "Remove",
    removeConfirm:
      "Remove the domain {domain}? Your storefront will remain available on the Pashove address.",
    addIntro:
      "Connect your domain name to sell under your own address. Verification is handled by Vercel, including the certificate.",
    domainLabel: "Your domain",
    domainHint: "mystore.com or shop.mystore.com",
    connect: "Connect domain",
    connecting: "Connecting…",
    step1: "Enter your domain.",
    step2: "Add the DNS records shown.",
    step3: "Click Check: SSL is set up automatically.",
  },
};

function CopyButton({
  value,
  labels,
}: {
  value: string;
  labels: { copy: string; copied: string };
}) {
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
      {copied ? labels.copied : labels.copy}
    </button>
  );
}

function DnsRow({
  type,
  name,
  value,
  labels,
}: {
  type: string;
  name: string;
  value: string;
  labels: { copy: string; copied: string };
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
      <CopyButton value={value} labels={labels} />
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
  const copy = locale === "en" ? COPY.en : COPY.fr;
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
              {copy.freeEyebrow}
            </p>
            <h2 className="mt-1 text-[1.0625rem] font-medium text-fg">
              {freeHost}
            </h2>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
              {copy.freeNote}
            </p>
          </div>
          <CopyButton
            value={`https://${freeHost}`}
            labels={{ copy: copy.copy, copied: copy.copied }}
          />
        </div>

        {reservedSubdomain ? (
          <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/[0.08] px-3 py-2.5 text-[0.75rem] leading-relaxed text-amber-700 dark:text-amber-300">
            {copy.reserved.replace("{slug}", storeSlug)}
          </p>
        ) : null}
      </section>

      <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">
          {copy.customEyebrow}
        </p>

        {!owner ? (
          <p className="mt-3 text-[0.875rem] leading-relaxed text-subtle">
            {copy.ownerOnly}
          </p>
        ) : !configured ? (
          <p className="mt-3 text-[0.875rem] leading-relaxed text-subtle">
            {copy.notConfigured}
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
                  {domain.status === "verified" ? copy.active : copy.pending}
                </p>
              </div>
              {domain.status === "verified" ? (
                <a
                  href={`https://${domain.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-[0.75rem] font-medium text-body transition-colors hover:border-border-strong"
                >
                  {copy.open}
                  <Icon path={icons.arrowRight} className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>

            {domain.status !== "verified" ? (
              <div className="mt-5 space-y-3">
                <p className="text-[0.8125rem] leading-relaxed text-subtle">
                  {copy.dnsIntro}
                </p>

                {apex ? (
                  <DnsRow
                    type="A"
                    name={recordName}
                    value={aValue}
                    labels={{ copy: copy.copy, copied: copy.copied }}
                  />
                ) : (
                  <DnsRow
                    type="CNAME"
                    name={recordName}
                    value={cnameValue}
                    labels={{ copy: copy.copy, copied: copy.copied }}
                  />
                )}

                {domain.verification.map((record, index) => (
                  <DnsRow
                    key={`${record.type}-${record.domain}-${index}`}
                    type={record.type.toUpperCase()}
                    name={record.domain}
                    value={record.value}
                    labels={{ copy: copy.copy, copied: copy.copied }}
                  />
                ))}

                {apex ? (
                  <p className="text-[0.6875rem] leading-relaxed text-faint">
                    {copy.apexNote.replace("{domain}", domain.domain)}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-emerald-700 dark:text-emerald-300">
                {copy.verifiedNote}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              {domain.status !== "verified" ? (
                <form action={verifyDomainAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <button type="submit" className={buttonClass({ size: "sm" })}>
                    {copy.verify}
                  </button>
                </form>
              ) : null}

              <form
                action={removeDomainAction}
                onSubmit={(event) => {
                  if (
                    !window.confirm(
                      copy.removeConfirm.replace("{domain}", domain.domain),
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
                  {copy.remove}
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-subtle">
              {copy.addIntro}
            </p>

            <form action={formAction} className="mt-5 space-y-4">
              <input type="hidden" name="locale" value={locale} />
              <TextField
                name="domain"
                label={copy.domainLabel}
                hint={copy.domainHint}
                placeholder={copy.domainHint}
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
                {pending ? copy.connecting : copy.connect}
              </button>
            </form>

            <ol className="mt-6 grid gap-3 text-[0.75rem] leading-relaxed text-subtle sm:grid-cols-3">
              <li className="rounded-2xl border border-border bg-bg p-3.5">
                <span className="font-semibold text-fg">1.</span> {copy.step1}
              </li>
              <li className="rounded-2xl border border-border bg-bg p-3.5">
                <span className="font-semibold text-fg">2.</span> {copy.step2}
              </li>
              <li className="rounded-2xl border border-border bg-bg p-3.5">
                <span className="font-semibold text-fg">3.</span> {copy.step3}
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
