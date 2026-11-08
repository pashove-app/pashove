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

function errorMessage(result: { code: string; message: string }): string {
  switch (result.code) {
    case "not_configured":
      return "Les domaines personnalisés ne sont pas encore configurés sur cette plateforme.";
    case "token_invalid":
      return "Le jeton Vercel est invalide. Contacte le support Pashove.";
    case "forbidden":
      return "Le projet Vercel refuse l’ajout de ce domaine. Contacte le support Pashove.";
    case "payment_required":
      return "Le compte Vercel demande une mise à jour de paiement.";
    case "domain_taken":
      return "Ce domaine est déjà rattaché à un autre projet Vercel. Retire-le là-bas avant de réessayer.";
    case "invalid_domain":
      return "Ce domaine n’est pas valide.";
    case "network_error":
      return "L’API Vercel est injoignable. Réessaie dans quelques instants.";
    default:
      return result.message || "Vercel a refusé la demande.";
  }
}

export async function addDomainAction(
  _previous: DomainActionState,
  formData: FormData,
): Promise<DomainActionState> {
  const locale = resolveLocale(field(formData, "locale") || "fr");
  const domain = normalizeCustomDomain(field(formData, "domain"));

  if (!domain) {
    return {
      status: "error",
      message:
        "Saisis un domaine valide, par exemple maboutique.com ou boutique.maboutique.com.",
    };
  }

  const membership = await currentMembership();
  if (!membership) {
    return { status: "error", message: "Boutique introuvable." };
  }
  if (membership.role !== "owner") {
    return {
      status: "error",
      message: "Seul le propriétaire de la boutique peut connecter un domaine.",
    };
  }
  if (!isDomainsConfigured()) {
    return {
      status: "error",
      message:
        "Les domaines personnalisés ne sont pas configurés sur cette plateforme.",
    };
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
      message: `Un domaine est déjà connecté à cette boutique (${current.domain}). Supprime-le avant d’en ajouter un autre.`,
    };
  }

  // Vérification globale : un domaine ne peut appartenir qu'à une boutique.
  // La RLS ne montre que la boutique courante, d'où le client de service.
  const service = createServiceClient();
  if (!service) {
    return {
      status: "error",
      message: "Le service de domaines n’est pas configuré. Contacte le support Pashove.",
    };
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
          ? "Ce domaine est déjà connecté à ta boutique."
          : "Ce domaine est déjà utilisé par une autre boutique Pashove.",
    };
  }

  const added = await addProjectDomain(domain);
  if (!added.ok) {
    console.error("[domains] vercel add failed", {
      domain,
      status: added.status,
      code: added.code,
    });
    return { status: "error", message: errorMessage(added) };
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
      message:
        error.code === "23505"
          ? "Ce domaine vient d’être connecté par une autre boutique."
          : "Impossible d’enregistrer le domaine. Réessaie.",
    };
  }

  revalidatePath(`/${locale}/app/settings/domains`);

  return {
    status: "success",
    message:
      status === "verified"
        ? "Domaine connecté et actif."
        : "Domaine ajouté. Configure les enregistrements DNS ci-dessous, puis clique sur Vérifier.",
  };
}

export async function verifyDomainAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(field(formData, "locale") || "fr");
  const membership = await currentMembership();

  if (!membership || membership.role !== "owner") {
    redirect(
      `/${locale}/app/settings/domains?error=${encodeURIComponent(
        "Seul le propriétaire peut gérer le domaine.",
      )}`,
    );
  }

  if (!isDomainsConfigured()) {
    redirect(
      `/${locale}/app/settings/domains?error=${encodeURIComponent(
        "Les domaines personnalisés ne sont pas configurés sur cette plateforme.",
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
        "Aucun domaine à vérifier.",
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
        errorMessage(project),
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
        "Vérification impossible pour le moment.",
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
        "Seul le propriétaire peut gérer le domaine.",
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
        "Aucun domaine à supprimer.",
      )}`,
    );
  }

  if (isDomainsConfigured()) {
    const removed = await removeProjectDomain(row.domain);
    if (!removed.ok) {
      redirect(
        `/${locale}/app/settings/domains?error=${encodeURIComponent(
          errorMessage(removed),
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
        "Suppression impossible pour le moment.",
      )}`,
    );
  }

  forgetCustomDomain(row.domain);
  revalidatePath(`/${locale}/app/settings/domains`);
  redirect(`/${locale}/app/settings/domains?removed=1`);
}
