import { createClient } from "@/lib/supabase/server";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderPaymentStatus = "pending" | "paid" | "refunded" | "failed";

export type OrderStatusFilter =
  | "all"
  | "pending"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderSummary = {
  id: string;
  number: number;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  payment_method: "cod";
  total_amount: number;
  currency: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  item_count: number;
};

const COLUMNS = [
  "id, number, status, payment_status, payment_method, total_amount, currency",
  "customer_name, customer_phone, created_at",
  "order_items(quantity)",
].join(", ");

type Row = Omit<OrderSummary, "item_count"> & {
  order_items?: { quantity: number }[] | null;
};

function toSummary(row: Row): OrderSummary {
  return {
    ...row,
    item_count: (row.order_items ?? []).reduce(
      (total, item) => total + item.quantity,
      0,
    ),
  };
}

function safeSearch(raw: string): string {
  return raw
    .replace(/[%,()*\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/** Borne de date de la période choisie, hors composant React. */
export function sinceForPeriod(period: string): string | null {
  if (period === "all") return null;
  return new Date(Date.now() - Number(period) * 86_400_000).toISOString();
}

/** Les commandes d'une boutique, filtrées, paginées. */
export async function listOrders(
  storeId: string,
  options: {
    status?: OrderStatusFilter;
    query?: string;
    since?: string | null;
    page?: number;
    perPage?: number;
  } = {},
): Promise<{ orders: OrderSummary[]; total: number }> {
  const supabase = await createClient();
  const page = Math.max(1, options.page ?? 1);
  const perPage = options.perPage ?? 20;
  const from = (page - 1) * perPage;

  let request = supabase
    .from("orders")
    .select(COLUMNS, { count: "exact" })
    .eq("store_id", storeId);

  const status = options.status ?? "all";
  if (status === "preparing") {
    request = request.in("status", ["confirmed", "processing"]);
  } else if (status !== "all") {
    request = request.eq("status", status);
  }

  if (options.since) request = request.gte("created_at", options.since);

  const term = safeSearch(options.query ?? "");
  if (term) {
    const conditions = [
      `customer_name.ilike.%${term}%`,
      `customer_email.ilike.%${term}%`,
      `customer_phone.ilike.%${term}%`,
    ];
    if (/^\d{1,9}$/.test(term)) conditions.push(`number.eq.${Number(term)}`);
    request = request.or(conditions.join(","));
  }

  const { data, count } = await request
    .order("created_at", { ascending: false })
    .range(from, from + perPage - 1);

  return {
    orders: ((data ?? []) as unknown as Row[]).map(toSummary),
    total: count ?? 0,
  };
}

export type OrderCounts = {
  all: number;
  pending: number;
  preparing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
};

/** Compteurs des onglets, sur la période choisie. */
export async function orderCounts(
  storeId: string,
  since: string | null,
): Promise<OrderCounts> {
  const supabase = await createClient();

  const base = () =>
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId);

  const withPeriod = <T extends { gte: (column: string, value: string) => T }>(
    request: T,
  ) => (since ? request.gte("created_at", since) : request);

  const [all, pending, preparing, shipped, delivered, cancelled] =
    await Promise.all([
      withPeriod(base()),
      withPeriod(base().eq("status", "pending")),
      withPeriod(base().in("status", ["confirmed", "processing"])),
      withPeriod(base().eq("status", "shipped")),
      withPeriod(base().eq("status", "delivered")),
      withPeriod(base().eq("status", "cancelled")),
    ]);

  return {
    all: all.count ?? 0,
    pending: pending.count ?? 0,
    preparing: preparing.count ?? 0,
    shipped: shipped.count ?? 0,
    delivered: delivered.count ?? 0,
    cancelled: cancelled.count ?? 0,
  };
}

export type OrderHeader = {
  id: string;
  number: number;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  created_at: string;
  total_amount: number;
  currency: string;
};

/** En-tête minimal pour l'écran de détail provisoire. */
export async function getOrderHeader(
  id: string,
  storeId: string,
): Promise<OrderHeader | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select(
      "id, number, status, payment_status, created_at, total_amount, currency",
    )
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();

  return (data as OrderHeader | null) ?? null;
}
