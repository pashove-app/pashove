import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { listAllExchangeRates } from "@/lib/payments/saspay/client";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BATCH_SIZE = 500;

/**
 * Synchronise les taux SasPay dans `fx_rates`.
 *
 * L'API renvoie ≈ 9 000 paires sur 91 pages : on ne les parcourt jamais au
 * checkout, uniquement ici. Les taux `manual` posés par un admin ne sont pas
 * touchés.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: "service_role_missing" }, { status: 503 });
  }

  const startedAt = new Date().toISOString();

  let rates;
  try {
    rates = await listAllExchangeRates();
  } catch (error) {
    console.error("[fx] rates fetch failed", error);
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }

  const seen = new Set<string>();
  const rows = [];

  for (const rate of rates) {
    const from = rate.from_currency?.trim().toUpperCase();
    const to = rate.to_currency?.trim().toUpperCase();
    const value = String(rate.rate ?? "").trim();

    if (!from || !to || from === to) continue;
    if (!Number.isFinite(Number(value)) || Number(value) <= 0) continue;

    const key = `${from}:${to}`;
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({
      from_currency: from,
      to_currency: to,
      rate: value,
      source: "saspay",
      updated_at: startedAt,
    });
  }

  let synced = 0;
  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const chunk = rows.slice(index, index + BATCH_SIZE);
    const { error } = await service
      .from("fx_rates")
      .upsert(chunk, { onConflict: "from_currency,to_currency" });

    if (error) {
      console.error("[fx] upsert failed", error.message);
      return NextResponse.json(
        { error: "upsert_failed", synced },
        { status: 500 },
      );
    }

    synced += chunk.length;
  }

  // Les paires qui ne sont plus renvoyées par SasPay disparaissent.
  const { error: cleanupError, count } = await service
    .from("fx_rates")
    .delete({ count: "exact" })
    .eq("source", "saspay")
    .lt("updated_at", startedAt);

  if (cleanupError) {
    console.error("[fx] cleanup failed", cleanupError.message);
  }

  return NextResponse.json({
    ok: true,
    synced,
    removed: count ?? 0,
    total: rows.length,
  });
}
