import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod } from "@/lib/payments/types";

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
  payment_method: PaymentMethod;
  total_amount: number;
  currency: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  item_count: number;
  has_physical: boolean;
};

const COLUMNS = [
  "id, number, status, payment_status, payment_method, total_amount, currency",
  "customer_name, customer_phone, created_at",
  "order_items(quantity, product_type)",
].join(", ");

type Row = Omit<OrderSummary, "item_count" | "has_physical"> & {
  order_items?: { quantity: number; product_type: string }[] | null;
};

function toSummary(row: Row): OrderSummary {
  const items = row.order_items ?? [];

  return {
    ...row,
    item_count: items.reduce((total, item) => total + item.quantity, 0),
    has_physical: items.some(
      (item) =>
        item.product_type === "physical" || item.product_type === "bundle",
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

export type OrderDetail = {
  id: string;
  number: number;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  payment_method: PaymentMethod;
  currency: string;
  subtotal_amount: number;
  discount_amount: number;
  discount_code: string | null;
  shipping_amount: number;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_country: string;
  shipping_city: string;
  shipping_address: string;
  shipping_extra: string | null;
  notes: string | null;
  tracking_number: string | null;
  created_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  has_physical: boolean;
  items: {
    id: string;
    product_name: string;
    variant_label: string | null;
    sku: string | null;
    image_key: string | null;
    product_type: "physical" | "digital" | "service" | "bundle";
    unit_price: number;
    quantity: number;
    line_total: number;
    bundle_id: string | null;
    bundle_contents: {
      product_name: string;
      variant_label: string | null;
      quantity: number;
    }[];
    partner_offer_id: string | null;
    partner_commission_amount: number;
    partner_source_revenue: number;
  }[];
  events: {
    id: string;
    type: string;
    payload: Record<string, unknown>;
    created_at: string;
  }[];
  payment: {
    provider: string;
    status: string;
    amount: number;
    currency: string;
    created_at: string;
  } | null;
};

type DetailRow = Omit<OrderDetail, "items" | "events" | "payment"> & {
  order_items?: OrderDetail["items"] | null;
  order_events?: OrderDetail["events"] | null;
  payments?: NonNullable<OrderDetail["payment"]>[] | null;
};

/** Une commande complète, avec ses instantanés, son paiement et son journal. */
export async function getOrder(
  id: string,
  storeId: string,
): Promise<OrderDetail | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select(
      [
        "id, number, status, payment_status, payment_method, currency",
        "subtotal_amount, discount_amount, discount_code, shipping_amount, total_amount",
        "customer_name, customer_email, customer_phone",
        "shipping_country, shipping_city, shipping_address, shipping_extra",
        "notes, tracking_number, created_at, confirmed_at, cancelled_at",
        "order_items(id, product_name, variant_label, sku, image_key, product_type, unit_price, quantity, line_total, bundle_id, bundle_contents, partner_offer_id, partner_commission_amount, partner_source_revenue)",
        "order_events(id, type, payload, created_at)",
        "payments(provider, status, amount, currency, created_at)",
      ].join(", "),
    )
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!data) return null;

  const row = data as unknown as DetailRow;
  const items = row.order_items ?? [];

  return {
    ...row,
    has_physical: items.some(
      (item) =>
        item.product_type === "physical" || item.product_type === "bundle",
    ),
    items,
    events: [...(row.order_events ?? [])].sort(
      (left, right) =>
        new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
    ),
    payment: row.payments?.[0] ?? null,
  };
}

export type OrderRefundLine = {
  order_item_id: string;
  quantity: number;
  amount: number;
  product_name: string;
  variant_label: string | null;
};

export type OrderRefund = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reason: string | null;
  provider_reference: string | null;
  created_at: string;
  completed_at: string | null;
  items: OrderRefundLine[];
};

type RefundRow = Omit<OrderRefund, "items"> & {
  refund_items?: {
    order_item_id: string;
    quantity: number;
    amount: number;
    order_item:
      | { product_name: string; variant_label: string | null }
      | { product_name: string; variant_label: string | null }[]
      | null;
  }[] | null;
};

/** Les remboursements d'une commande, avec leurs lignes. */
export async function listOrderRefunds(
  orderId: string,
  storeId: string,
): Promise<OrderRefund[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("refunds")
    .select(
      [
        "id, amount, currency, status, reason, provider_reference",
        "created_at, completed_at",
        "refund_items(order_item_id, quantity, amount, order_item:order_items(product_name, variant_label))",
      ].join(", "),
    )
    .eq("order_id", orderId)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as RefundRow[]).map((row) => ({
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    reason: row.reason,
    provider_reference: row.provider_reference,
    created_at: row.created_at,
    completed_at: row.completed_at,
    items: (row.refund_items ?? []).map((item) => {
      const product = Array.isArray(item.order_item)
        ? item.order_item[0]
        : item.order_item;
      return {
        order_item_id: item.order_item_id,
        quantity: item.quantity,
        amount: item.amount,
        product_name: product?.product_name ?? "Article",
        variant_label: product?.variant_label ?? null,
      };
    }),
  }));
}
