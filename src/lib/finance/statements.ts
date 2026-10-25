import { signedAmount } from "@/lib/finance/display";
import type { LedgerKind } from "@/lib/finance/queries";
import { createClient } from "@/lib/supabase/server";

export type StatementRow = {
  id: string;
  kind: LedgerKind;
  occurred_at: string;
  amount: number;
  signed: number;
  currency: string;
  role: string | null;
  orderNumber: number | null;
  orderId: string | null;
  demo: boolean;
};

export type StatementBalances = {
  available: number;
  pending: number;
  reserved: number;
  codCash: number;
  commissionDue: number;
};

export type Statement = {
  rows: StatementRow[];
  balances: StatementBalances;
  sales: number;
  commissions: number;
  payouts: number;
};

type MovementRow = {
  id: string;
  kind: LedgerKind;
  source_type: string;
  source_id: string | null;
  occurred_at: string;
  metadata: { order_number?: number; role?: string; demo?: boolean } | null;
  entries: { direction: "debit" | "credit"; amount: number; currency: string }[];
};

type BalanceRow = { code: string; currency: string; balance: number };

/** Bornes UTC d'un mois `YYYY-MM`, avec repli sur le mois courant. */
export function monthRange(
  month: string | undefined,
  localeTag = "fr-FR",
): { month: string; from: string; to: string; label: string } {
  const now = new Date();
  let year = now.getUTCFullYear();
  let index = now.getUTCMonth() + 1;

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [rawYear, rawMonth] = month.split("-").map(Number);
    if (rawMonth >= 1 && rawMonth <= 12) {
      year = rawYear;
      index = rawMonth;
    }
  }

  const from = new Date(Date.UTC(year, index - 1, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, index, 1, 0, 0, 0, 0) - 1);
  const normalized = `${year}-${String(index).padStart(2, "0")}`;

  return {
    month: normalized,
    from: from.toISOString(),
    to: to.toISOString(),
    label: new Intl.DateTimeFormat(localeTag, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(from),
  };
}

export async function getStatement(
  storeId: string,
  from: string,
  to: string,
): Promise<Statement> {
  const supabase = await createClient();

  const [transactions, balances] = await Promise.all([
    supabase
      .from("ledger_transactions")
      .select(
        "id, kind, source_type, source_id, occurred_at, metadata, entries:ledger_entries(direction, amount, currency)",
      )
      .eq("store_id", storeId)
      .gte("occurred_at", from)
      .lte("occurred_at", to)
      .order("occurred_at", { ascending: true }),
    supabase.rpc("store_balances_at", {
      p_store_id: storeId,
      p_at: to,
    }),
  ]);

  const rows: StatementRow[] = (
    (transactions.data ?? []) as unknown as MovementRow[]
  ).map((row) => {
    const amount = row.entries
      .filter((entry) => entry.direction === "debit")
      .reduce((total, entry) => total + entry.amount, 0);

    const movement = {
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

    return {
      id: row.id,
      kind: row.kind,
      occurred_at: row.occurred_at,
      amount,
      signed: signedAmount(movement),
      currency: movement.currency,
      role: movement.role,
      orderNumber: movement.orderNumber,
      orderId: movement.orderId,
      demo: movement.demo,
    };
  });

  const byCode = new Map(
    ((balances.data ?? []) as BalanceRow[]).map((row) => [row.code, row.balance]),
  );

  const sumSigned = (kinds: LedgerKind[]) =>
    rows
      .filter((row) => kinds.includes(row.kind))
      .reduce((total, row) => total + row.signed, 0);

  return {
    rows,
    balances: {
      available: byCode.get("available") ?? 0,
      pending: byCode.get("pending") ?? 0,
      reserved: byCode.get("reserved") ?? 0,
      codCash: byCode.get("cod_cash") ?? 0,
      commissionDue: -(byCode.get("commission_due") ?? 0),
    },
    sales: sumSigned(["cod_sale", "online_capture", "refund"]),
    commissions: -sumSigned(["commission"]),
    payouts: -sumSigned(["payout_paid"]),
  };
}
