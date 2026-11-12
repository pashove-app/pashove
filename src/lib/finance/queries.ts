import { createClient } from "@/lib/supabase/server";

export type StoreBalances = {
  /** Solde retirable, en unité mineure. */
  available: number;
  /** Encaissé en ligne, pas encore réglé. */
  pending: number;
  /** Disponible immobilisé par un retrait en cours. */
  reserved: number;
  /** Espèces COD reçues par le marchand, jamais retirables. */
  codCash: number;
  /** Commission due à Pashove, exprimée en positif. */
  commissionDue: number;
};

export type LedgerKind =
  | "cod_sale"
  | "commission"
  | "online_capture"
  | "settlement"
  | "refund"
  | "payout_request"
  | "payout_paid"
  | "payout_released"
  | "adjustment";

export type LedgerMovement = {
  id: string;
  kind: LedgerKind;
  occurred_at: string;
  amount: number;
  currency: string;
  /** `charge`, `reversal`, `refund`… selon le mouvement. */
  role: string | null;
  sourceType: string;
  /** Écriture de démonstration, clairement identifiée dans l'interface. */
  demo: boolean;
  /** Numéro de commande, quand le mouvement en vient. */
  orderNumber: number | null;
  orderId: string | null;
};

export type LedgerFilter = "all" | "cod_sale" | "commission" | "refund";

export type LedgerPeriod = "7" | "30" | "90" | "all";

/** Date de début d'une période, calculée côté serveur. */
export function ledgerSince(period: LedgerPeriod): string | null {
  if (period === "all") return null;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - Number(period));
  return since.toISOString();
}

type BalanceRow = { code: string; currency: string; balance: number };

const EMPTY_BALANCES: StoreBalances = {
  available: 0,
  pending: 0,
  reserved: 0,
  codCash: 0,
  commissionDue: 0,
};

/**
 * Soldes calculés en base, jamais stockés.
 *
 * `commission_due` est un passif : ses crédits rendent le solde signé négatif.
 * On le renvoie en positif, prêt à être affiché comme une somme à régler.
 */
export async function getStoreBalances(storeId: string): Promise<StoreBalances> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("store_balances", {
    p_store_id: storeId,
  });

  if (error || !data) return EMPTY_BALANCES;

  const balances = { ...EMPTY_BALANCES };

  for (const row of data as BalanceRow[]) {
    if (row.code === "available") balances.available = row.balance;
    if (row.code === "pending") balances.pending = row.balance;
    if (row.code === "reserved") balances.reserved = row.balance;
    if (row.code === "cod_cash") balances.codCash = row.balance;
    if (row.code === "commission_due") balances.commissionDue = -row.balance;
  }

  return balances;
}

type MovementRow = {
  id: string;
  kind: LedgerKind;
  source_type: string;
  source_id: string | null;
  occurred_at: string;
  metadata: { order_number?: number; role?: string; demo?: boolean } | null;
  entries: { direction: "debit" | "credit"; amount: number; currency: string }[];
};

/** Derniers mouvements du journal, du plus récent au plus ancien. */
export async function listRecentLedger(
  storeId: string,
  limit = 8,
): Promise<LedgerMovement[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("ledger_transactions")
    .select(
      "id, kind, source_type, source_id, occurred_at, metadata, entries:ledger_entries(direction, amount, currency)",
    )
    .eq("store_id", storeId)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as MovementRow[]).map(toMovement);
}

function toMovement(row: MovementRow): LedgerMovement {
  const amount = row.entries
    .filter((entry) => entry.direction === "debit")
    .reduce((total, entry) => total + entry.amount, 0);

  return {
    id: row.id,
    kind: row.kind,
    occurred_at: row.occurred_at,
    amount,
    currency: row.entries[0]?.currency ?? "XOF",
    role: row.metadata?.role ?? null,
    sourceType: row.source_type,
    demo: row.metadata?.demo === true,
    orderNumber: row.metadata?.order_number ?? null,
    orderId: row.source_type === "order" ? row.source_id : null,
  };
}

/**
 * Journal paginé, filtrable par type et par période.
 *
 * La source reste lisible dans chaque ligne ; les filtres ne font que réduire
 * l'ensemble, jamais recalculer un montant côté client.
 */
export async function listLedgerTransactions(
  storeId: string,
  options: {
    kind: LedgerFilter;
    since: string | null;
    page: number;
    pageSize?: number;
  },
): Promise<{ items: LedgerMovement[]; total: number }> {
  const supabase = await createClient();
  const pageSize = options.pageSize ?? 20;
  const from = Math.max(options.page - 1, 0) * pageSize;

  let query = supabase
    .from("ledger_transactions")
    .select(
      "id, kind, source_type, source_id, occurred_at, metadata, entries:ledger_entries(direction, amount, currency)",
      { count: "exact" },
    )
    .eq("store_id", storeId);

  if (options.kind !== "all") query = query.eq("kind", options.kind);
  if (options.since) query = query.gte("occurred_at", options.since);

  const { data, count } = await query
    .order("occurred_at", { ascending: false })
    .range(from, from + pageSize - 1);

  return {
    items: ((data ?? []) as unknown as MovementRow[]).map(toMovement),
    total: count ?? 0,
  };
}

export type PayoutMethod = {
  id: string;
  country: string;
  provider: string;
  account_name: string;
  account_last4: string;
  is_default: boolean;
  created_at: string;
};

const METHOD_COLUMNS =
  "id, country, provider, account_name, account_last4, is_default, created_at";

/** Méthodes actives, la méthode par défaut d'abord. */
export async function listPayoutMethods(
  storeId: string,
): Promise<PayoutMethod[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("payout_methods")
    .select(METHOD_COLUMNS)
    .eq("store_id", storeId)
    .is("archived_at", null)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  return (data ?? []) as unknown as PayoutMethod[];
}

export async function getPayoutMethod(
  id: string,
  storeId: string,
): Promise<PayoutMethod | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("payout_methods")
    .select(METHOD_COLUMNS)
    .eq("id", id)
    .eq("store_id", storeId)
    .is("archived_at", null)
    .maybeSingle();

  return (data as unknown as PayoutMethod | null) ?? null;
}

/** Chiffré, réservé au serveur au moment d'un virement (F4). */
export async function getPayoutMethodSecret(
  id: string,
  storeId: string,
): Promise<{ id: string; provider: string; account_number_encrypted: string } | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("payout_methods")
    .select("id, provider, account_number_encrypted")
    .eq("id", id)
    .eq("store_id", storeId)
    .is("archived_at", null)
    .maybeSingle();

  return (
    (data as unknown as {
      id: string;
      provider: string;
      account_number_encrypted: string;
    } | null) ?? null
  );
}

export type PayoutSecurity = {
  hasPin: boolean;
  lockedUntil: string | null;
  pinUpdatedAt: string | null;
};

type SecurityRow = {
  has_pin: boolean;
  locked_until: string | null;
  pin_updated_at: string | null;
};

export async function getPayoutSecurity(
  storeId: string,
): Promise<PayoutSecurity> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("store_security_status", {
    p_store_id: storeId,
  });

  const row = (data as SecurityRow[] | null)?.[0];

  if (error || !row) return { hasPin: false, lockedUntil: null, pinUpdatedAt: null };

  return {
    hasPin: row.has_pin,
    lockedUntil: row.locked_until,
    pinUpdatedAt: row.pin_updated_at,
  };
}

export type PayoutStatus =
  | "requested"
  | "security_check"
  | "processing"
  | "sent"
  | "completed"
  | "failed"
  | "reversed"
  | "cancelled";

export type PayoutSummary = {
  id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  provider: string;
  account_name: string;
  account_last4: string;
  requested_at: string;
  cancelled_at: string | null;
};

const PAYOUT_COLUMNS =
  "id, amount, currency, status, provider, account_name, account_last4, requested_at, cancelled_at";

export async function listPayouts(storeId: string): Promise<PayoutSummary[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("payouts")
    .select(PAYOUT_COLUMNS)
    .eq("store_id", storeId)
    .order("requested_at", { ascending: false });

  return (data ?? []) as unknown as PayoutSummary[];
}

export async function getPayout(
  id: string,
  storeId: string,
): Promise<PayoutSummary | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("payouts")
    .select(PAYOUT_COLUMNS)
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();

  return (data as unknown as PayoutSummary | null) ?? null;
}

/** Réserve de remboursement calculée par le cron quotidien. */
export async function getStoreReserve(storeId: string): Promise<number> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("store_financial_reserves")
    .select("reserved_fcfa")
    .eq("store_id", storeId)
    .maybeSingle();

  const value = Number((data as { reserved_fcfa?: number } | null)?.reserved_fcfa ?? 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}
