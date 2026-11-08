import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { dnsFromConfig, statusFrom } from "@/lib/domains/dns";
import {
  getDomainConfig,
  getProjectDomain,
  isDomainsConfigured,
} from "@/lib/domains/vercel";

export const dynamic = "force-dynamic";

type PendingRow = { id: string; domain: string };

/**
 * Vérifie périodiquement les domaines en attente.
 *
 * Le bouton « Vérifier maintenant » reste la voie principale ; ce cron évite
 * qu'un domaine reste bloqué parce que le marchand a fermé son navigateur
 * juste après avoir ajouté ses enregistrements DNS. Vercel émet le certificat
 * SSL automatiquement dès que le domaine est vérifié et correctement pointé.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isDomainsConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: "service_role_missing" }, { status: 503 });
  }

  const { data, error } = await service
    .from("store_domains")
    .select("id, domain")
    .eq("status", "pending")
    .order("updated_at", { ascending: true })
    .limit(25);

  if (error) {
    console.error("[domains] cron read failed", error.message);
    return NextResponse.json({ error: "read_failed" }, { status: 500 });
  }

  const rows = (data ?? []) as PendingRow[];
  let verified = 0;
  let pending = 0;
  let errors = 0;

  for (const row of rows) {
    const [project, config] = await Promise.all([
      getProjectDomain(row.domain),
      getDomainConfig(row.domain),
    ]);

    const now = new Date().toISOString();

    if (!project.ok) {
      errors += 1;
      await service
        .from("store_domains")
        .update({
          last_checked_at: now,
          last_error: project.code,
          updated_at: now,
        })
        .eq("id", row.id);
      continue;
    }

    const status = statusFrom(project.data.verified === true, config);

    const { error: updateError } = await service
      .from("store_domains")
      .update({
        status,
        apex_name: project.data.apexName,
        verification: project.data.verification ?? [],
        dns: dnsFromConfig(config),
        last_checked_at: now,
        last_error: status === "verified" ? null : "dns_pending",
        updated_at: now,
      })
      .eq("id", row.id);

    if (updateError) {
      errors += 1;
      console.error("[domains] cron update failed", updateError.message);
    } else if (status === "verified") {
      verified += 1;
      console.info("[domains] verified", { domain: row.domain });
    } else {
      pending += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    checked: rows.length,
    verified,
    pending,
    errors,
  });
}
