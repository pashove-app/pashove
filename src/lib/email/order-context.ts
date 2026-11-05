import { createServiceClient } from "@/lib/supabase/service";
import { formatAddress } from "./events";
import type { OrderEmailContext } from "./events";

type OrderRow = {
  id: string;
  number: number;
  store_id: string;
  currency: string;
  total_amount: number;
  subtotal_amount: number;
  discount_amount: number;
  shipping_amount: number;
  customer_name: string;
  customer_email: string;
  payment_method: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_country: string | null;
  tracking_number: string | null;
  order_items: {
    product_name: string;
    variant_label: string | null;
    product_type: string;
    quantity: number;
    line_total: number;
  }[];
  stores: { name: string; slug: string } | null;
};

/**
 * Contexte d'e-mail lu avec le service role.
 *
 * Réservé aux parcours où l'acteur n'est pas membre de la boutique — un
 * administrateur plateforme qui rembourse, par exemple. Sans service role,
 * la fonction renonce : aucun e-mail ne part, mais aucune exception non plus.
 */
export async function loadOrderContextWithService(
  orderId: string,
): Promise<OrderEmailContext | null> {
  const service = createServiceClient();
  if (!service) return null;

  const { data } = await service
    .from("orders")
    .select(
      [
        "id, number, store_id, currency, total_amount, subtotal_amount, discount_amount",
        "shipping_amount, customer_name, customer_email, payment_method",
        "shipping_address, shipping_city, shipping_country, tracking_number",
        "order_items(product_name, variant_label, product_type, quantity, line_total)",
        "stores(name, slug)",
      ].join(", "),
    )
    .eq("id", orderId)
    .maybeSingle();

  const row = data as OrderRow | null;
  if (!row) return null;

  return {
    storeId: row.store_id,
    storeName: row.stores?.name ?? "Pashove",
    storeSlug: row.stores?.slug ?? "",
    orderId: row.id,
    orderNumber: row.number,
    currency: row.currency,
    total: row.total_amount,
    subtotal: row.subtotal_amount,
    discount: row.discount_amount,
    shipping: row.shipping_amount,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    paymentMethod: row.payment_method,
    trackingNumber: row.tracking_number,
    address: formatAddress({
      address: row.shipping_address,
      city: row.shipping_city,
      country: row.shipping_country,
    }),
    items: row.order_items.map((item) => ({
      name: item.product_name,
      variantLabel: item.variant_label,
      quantity: item.quantity,
      lineTotal: item.line_total,
    })),
    hasDigital: row.order_items.some((item) => item.product_type === "digital"),
    hasService: row.order_items.some((item) => item.product_type === "service"),
  };
}
