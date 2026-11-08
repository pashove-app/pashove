"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveLocale } from "@/i18n/config";
import { currentMembership } from "@/lib/stores/queries";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeCustomDomain } from "@/lib/domains/hosts";
import { dnsFromConfig, statusFrom } from "@/lib/domains/dns";
import type { DomainActionState } from "@/lib/domains/state";
import { forgetCustomDomain } from "@/lib/domains/lookup";
import {
  addProjectDomain,
  getDomainConfig,
  getProjectDomain,
  isDomainsConfigured,
  removeProjectDomain,
  verifyProjectDomain,
} from "@/lib/domains/vercel";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

type MessageKey =
  | "invalidDomain"
  | "storeNotFound"
  | "ownerOnly"
  | "notConfigured"
  | "alreadyConnected"
  | "domainAlreadyOurs"
  | "domainUsed"
  | "serviceMissing"
  | "insertFailed"
  | "domainRace"
  | "noDomainVerify"
  | "noDomainRemove"
  | "verificationFailed"
  | "deleteFailed"
  | "addActive"
  | "addPending"
  | "tokenInvalid"
  | "forbidden"
  | "paymentRequired"
  | "domainTaken"
  | "invalidDomainVercel"
  | "network"
  | "generic";

const MESSAGES: Record<"fr" | "en", Record<MessageKey, string>> = {
  fr: {
    invalidDomain:
      "Saisis un domaine valide, par exemple maboutique.com ou boutique.maboutique.com.",
    storeNotFound: "Boutique introuvable.",
    ownerOnly: "Seul le propriétaire de la boutique peut connecter un domaine.",
    notConfigured:
      "Les domaines personnalisés ne sont pas configurés sur cette plateforme.",
    alreadyConnected:
      "Un domaine est déjà connecté à cette boutique ({domain}). Supprime-le avant d’en ajouter un autre.",
    domainAlreadyOurs: "Ce domaine est déjà connecté à ta boutique.",
    domainUsed: "Ce domaine est déjà utilisé par une autre boutique Pashove.",
    serviceMissing:
      "Le service de domaines n’est pas configuré. Contacte le support Pashove.",
    insertFailed: "Impossible d’enregistrer le domaine. Réessaie.",
    domainRace: "Ce domaine vient d’être connecté par une autre boutique.",
    noDomainVerify: "Aucun domaine à vérifier.",
    noDomainRemove: "Aucun domaine à supprimer.",
    verificationFailed: "Vérification impossible pour le moment.",
    deleteFailed: "Suppression impossible pour le moment.",
    addActive: "Domaine connecté et actif.",
    addPending:
      "Domaine ajouté. Configure les enregistrements DNS ci-dessous, puis clique sur Vérifier.",
    tokenInvalid: "Le jeton Vercel est invalide. Contacte le support Pashove.",
    forbidden:
      "Le projet Vercel refuse l’ajout de ce domaine. Contacte le support Pashove.",
    paymentRequired: "Le compte Vercel demande une mise à jour de paiement.",
    domainTaken:
      "Ce domaine est déjà rattaché à un autre projet Vercel. Retire-le là-bas avant de réessayer.",
    invalidDomainVercel: "Ce domaine n’est pas valide.",
    network: "L’API Vercel est injoignable. Réessaie dans quelques instants.",
    generic: "Vercel a refusé la demande.",
  },
  en: {
    invalidDomain:
      "Enter a valid domain, for example mystore.com or shop.mystore.com.",
    storeNotFound: "Store not found.",
    ownerOnly: "Only the store owner can connect a domain.",
    notConfigured: "Custom domains are not configured on this platform.",
    alreadyConnected:
      "A domain is already connected to this store ({domain}). Remove it before adding another one.",
    domainAlreadyOurs: "This domain is already connected to your store.",
    domainUsed: "This domain is already used by another Pashove store.",
    serviceMissing:
      "The domain service is not configured. Contact Pashove support.",
    insertFailed: "Could not save the domain. Try again.",
    domainRace: "This domain was just connected by another store.",
    noDomainVerify: "No domain to check.",
    noDomainRemove: "No domain to remove.",
    verificationFailed: "Could not check the domain right now.",
    deleteFailed: "Could not remove the domain right now.",
    addActive: "Domain connected and active.",
    addPending:
      "Domain added. Add the DNS records below, then click Check.",
    tokenInvalid: "The Vercel token is invalid. Contact Pashove support.",
    forbidden:
      "The Vercel project refused this domain. Contact Pashove support.",
    paymentRequired: "The Vercel account requires a payment update.",
    domainTaken:
      "This domain is already attached to another Vercel project. Remove it there before trying again.",
    invalidDomainVercel: "This domain is not valid.",
    network: "The Vercel API is unreachable. Try again shortly.",
    generic: "Vercel refused the request.",
  },
};

function message(
  locale: string,
  key: MessageKey,
  values?: Record<string, string>,
): string {
  const pack = locale.startsWith("en") ? MESSAGES.en : MESSAGES.fr;
  let text = pack[key];
  if (values) {
    for (const [name, value] of Object.entries(values)) {
      text = text.replace(`{${name}}`, value);
    }
  }
  return text;
}

function errorMessage(
  result: { code: string; message: string },
  locale: string,
): string {
  switch (result.code) {
    case "not_configured":
      return message(locale, "notConfigured");
    case "token_invalid":
      return message(locale, "tokenInvalid");
    case "forbidden":
      return message(locale, "forbidden");
    case "payment_required":
      return message(locale, "paymentRequired");
    case "domain_taken":
      return message(locale, "domainTaken");
    case "invalid_domain":
      return message(locale, "invalidDomainVercel");
    case "network_error":
      return message(locale, "network");
    default:
      return result.message || message(locale, "generic");
  }
}

export async function addDomainAction(
  _previous: DomainActionState,
  formData: FormData,
): Promise<DomainActionState> {
  const locale = resolveLocale(field(formData, "locale") || "fr");
  const domain = normalizeCustomDomain(field(formData, "domain"));

  if (!domain) {
    return { status: "error", message: message(locale, "invalidDomain") };
  }

  const membership = await currentMembership();
  if (!membership) {
    return { status: "error", message: message(locale, "storeNotFound") };
  }
  if (membership.role !== "owner") {
    return { status: "error", message: message(locale, "ownerOnly") };
  }
  if (!isDomainsConfigured()) {
    return { status: "error", message: message(locale, "notConfigured") };
  }

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("store_domains")
    .select("id, domain")
    .eq("store_id", membership.store.id)
    .maybeSingle();

  if (current) {
    return {
      status: "error",
      message: message(locale, "alreadyConnected", {
        domain: current.domain,
      }),
    };
  }

  // Vérification globale : un domaine ne peut appartenir qu'à une boutique.
  // La RLS ne montre que la boutique courante, d'où le client de service.
  const service = createServiceClient();
  if (!service) {
    return { status: "error", message: message(locale, "serviceMissing") };
  }

  const { data: existing } = await service
    .from("store_domains")
    .select("store_id, domain")
    .eq("domain", domain)
    .maybeSingle();

  if (existing) {
    return {
      status: "error",
      message:
        existing.store_id === membership.store.id
          ? message(locale, "domainAlreadyOurs")
          : message(locale, "domainUsed"),
    };
  }

  const added = await addProjectDomain(domain);
  if (!added.ok) {
    console.error("[domains] vercel add failed", {
      domain,
      status: added.status,
      code: added.code,
    });
    return { status: "error", message: errorMessage(added, locale) };
  }

  const [project, config] = await Promise.all([
    getProjectDomain(domain),
    getDomainConfig(domain),
  ]);

  const verified = project.ok ? project.data.verified === true : false;
  const status = statusFrom(verified, config);

  const { error } = await supabase.from("store_domains").insert({
    store_id: membership.store.id,
    domain,
    apex_name: project.ok ? project.data.apexName : null,
    status,
    verification: project.ok ? (project.data.verification ?? []) : [],
    dns: dnsFromConfig(config),
    last_checked_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[domains] insert failed", error.message);

    // Un conflit signifie qu'une autre boutique vient de gagner la course :
    // retirer le domaine de Vercel casserait la gagnante.
    if (error.code !== "23505") {
      await removeProjectDomain(domain);
    }

    return {
      status: "error",
      message: message(
        locale,
        error.code === "23505" ? "domainRace" : "insertFailed",
      ),
    };
  }

  revalidatePath(`/${locale}/app/settings/domains`);

  return {
    status: "success",
    message: message(locale, status === "verified" ? "addActive" : "addPending"),
  };
}

export async function verifyDomainAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(field(formData, "locale") || "fr");
  const membership = await currentMembership();

  if (!membership || membership.role !== "owner") {
    redirect(
      `/${locale}/app/settings/domains?error=${encodeURIComponent(
        message(locale, "ownerOnly"),
      )}`,
    );
  }

  if (!isDomainsConfigured()) {
    redirect(
      `/${locale}/app/settings/domains?error=${encodeURIComponent(
        message(locale, "notConfigured"),
      )}`,
    );
  }

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("store_domains")
    .select("id, domain")
    .eq("store_id", membership.store.id)
    .maybeSingle();

  if (!row) {
    redirect(
      `/${locale}/app/settings/domains?error=${encodeURIComponent(
        message(locale, "noDomainVerify"),
      )}`,
    );
  }

  await verifyProjectDomain(row.domain);

  const [project, config] = await Promise.all([
    getProjectDomain(row.domain),
    getDomainConfig(row.domain),
  ]);

  if (!project.ok) {
    redirect(
      `/${locale}/app/settings/domains?error=${encodeURIComponent(
        errorMessage(project, locale),
      )}`,
    );
  }

  const status = statusFrom(project.data.verified === true, config);

  const { error } = await supabase
    .from("store_domains")
    .update({
      status,
      apex_name: project.data.apexName,
      verification: project.data.verification ?? [],
      dns: dnsFromConfig(config),
      last_checked_at: new Date().toISOString(),
      last_error: status === "verified" ? null : "dns_pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (error) {
    redirect(
      `/${locale}/app/settings/domains?error=${encodeURIComponent(
        message(locale, "verificationFailed"),
      )}`,
    );
  }

  if (status === "verified") forgetCustomDomain(row.domain);

  revalidatePath(`/${locale}/app/settings/domains`);
  redirect(`/${locale}/app/settings/domains?checked=1`);
}

export async function removeDomainAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(field(formData, "locale") || "fr");
  const membership = await currentMembership();

  if (!membership || membership.role !== "owner") {
    redirect(
      `/${locale}/app/settings/domains?error=${encodeURIComponent(
        message(locale, "ownerOnly"),
      )}`,
    );
  }

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("store_domains")
    .select("id, domain")
    .eq("store_id", membership.store.id)
    .maybeSingle();

  if (!row) {
    redirect(
      `/${locale}/app/settings/domains?error=${encodeURIComponent(
        message(locale, "noDomainRemove"),
      )}`,
    );
  }

  if (isDomainsConfigured()) {
    const removed = await removeProjectDomain(row.domain);
    if (!removed.ok) {
      redirect(
        `/${locale}/app/settings/domains?error=${encodeURIComponent(
          errorMessage(removed, locale),
        )}`,
      );
    }
  }

  const { error } = await supabase
    .from("store_domains")
    .delete()
    .eq("id", row.id);

  if (error) {
    redirect(
      `/${locale}/app/settings/domains?error=${encodeURIComponent(
        message(locale, "deleteFailed"),
      )}`,
    );
  }

  forgetCustomDomain(row.domain);
  revalidatePath(`/${locale}/app/settings/domains`);
  redirect(`/${locale}/app/settings/domains?removed=1`);
}
