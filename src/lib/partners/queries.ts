import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";

export type PartnerOffer = {
  id: string;
  commission_bps: number;
  active: boolean;
};

export type DiscoverOffer = {
  offerId: string;
  commissionBps: number;
  commissionLabel: string;
  productId: string;
  name: string;
  slug: string;
  description: string | null;
  priceAmount: number;
  priceLabel: string;
  stock: number | null;
  imageKey: string | null;
  storeName: string;
  storeSlug: string;
  salesCount: number;
  createdAt: string;
};

export type PartnerListing = {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published";
  priceLabel: string;
  sourceStoreName: string;
};

export type AffiliateLink = {
  id: string;
  code: string;
  active: boolean;
  commissionBps: number;
  productName: string;
  ownerStoreName: string;
  ownerStoreSlug: string;
  salesCount: number;
  earned: number;
  earnedLabel: string;
};

export type PartnerSale = {
  id: string;
  orderNumber: number;
  amountLabel: string;
  partnerCommissionLabel: string;
  platformCommissionLabel: string;
  sourceRevenueLabel: string;
  status: "pending" | "approved" | "paid" | "reversed";
  sourceStoreName: string;
  partnerStoreName: string;
  createdAt: string;
};

type OfferRow = {
  id: string;
  commission_bps: number;
  created_at: string;
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price_amount: number;
    stock_quantity: number | null;
    product_type: string;
    status: string;
    images: {
      position: number;
      media: { object_key: string } | null;
    }[] | null;
    store: { id: string; name: string; slug: string; status: string } | null;
  } | null;
};

const OFFER_COLUMNS = [
  "id, commission_bps, created_at",
  "product:products!product_id(id, name, slug, description, price_amount, stock_quantity, product_type, status, images:product_images(position, media:media_assets(object_key)), store:stores!store_id(id, name, slug, status))",
].join(", ");

/** L'offre d'un produit dans la boutique active, s'il y en a une. */
export async function getPartnerOffer(
  productId: string,
  storeId: string,
): Promise<PartnerOffer | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("partner_offers")
    .select("id, commission_bps, active")
    .eq("product_id", productId)
    .eq("store_id", storeId)
    .maybeSingle();

  return (data as PartnerOffer | null) ?? null;
}

/** Les produits que d'autres boutiques ont ouverts au partage. */
export async function listDiscoverOffers(
  storeId: string,
  currency: string,
  tag: string,
): Promise<DiscoverOffer[]> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("products")
    .select("source_product_id")
    .eq("store_id", storeId)
    .not("source_product_id", "is", null);

  const listed = new Set(
    ((existing ?? []) as { source_product_id: string | null }[])
      .map((row) => row.source_product_id)
      .filter((value): value is string => Boolean(value)),
  );

  const [{ data }, { data: stats }] = await Promise.all([
    supabase
      .from("partner_offers")
      .select(OFFER_COLUMNS)
      .eq("active", true)
      .neq("store_id", storeId),
    supabase.rpc("partner_offer_stats"),
  ]);

  const counts = (stats ?? {}) as Record<string, number>;
  const rows = (data ?? []) as unknown as OfferRow[];

  return rows
    .filter(
      (row) =>
        row.product &&
        row.product.status === "published" &&
        row.product.product_type === "physical" &&
        row.product.store?.status === "active" &&
        !listed.has(row.product.id),
    )
    .map((row) => {
      const product = row.product!;
      const images = [...(product.images ?? [])].sort(
        (left, right) => left.position - right.position,
      );
      const commission = Math.round(
        (product.price_amount * row.commission_bps) / 10000,
      );

      return {
        offerId: row.id,
        commissionBps: row.commission_bps,
        commissionLabel: formatMoney(commission, currency, tag),
        productId: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        priceAmount: product.price_amount,
        priceLabel: formatMoney(product.price_amount, currency, tag),
        stock: product.stock_quantity,
        imageKey: images[0]?.media?.object_key ?? null,
        storeName: product.store?.name ?? "",
        storeSlug: product.store?.slug ?? "",
        salesCount: Number(counts[row.id] ?? 0),
        createdAt: row.created_at,
      } satisfies DiscoverOffer;
    });
}

/** Les copies partenaires déjà publiées dans la boutique active. */
export async function listPartnerListings(
  storeId: string,
  currency: string,
  tag: string,
): Promise<PartnerListing[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "id, name, slug, status, price_amount, source_product_id, source:stores!partner_source_store_id(name)",
    )
    .eq("store_id", storeId)
    .not("source_product_id", "is", null)
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as {
    id: string;
    name: string;
    slug: string;
    status: "draft" | "published";
    price_amount: number;
    source: { name: string } | null;
  }[]).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    priceLabel: formatMoney(row.price_amount, currency, tag),
    sourceStoreName: row.source?.name ?? "",
  }));
}

/** Les liens d'affiliation générés par la boutique active. */
export async function listAffiliateLinks(
  storeId: string,
  currency: string,
  tag: string,
): Promise<AffiliateLink[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("list_affiliate_links", {
    p_store_id: storeId,
  });

  if (!Array.isArray(data)) return [];

  return (data as Record<string, unknown>[]).map((row) => {
    const earned = Number(row.earned ?? 0);
    return {
      id: String(row.id ?? ""),
      code: String(row.code ?? ""),
      active: row.active !== false,
      commissionBps: Number(row.commissionBps ?? 0),
      productName: String(row.productName ?? ""),
      ownerStoreName: String(row.ownerStoreName ?? ""),
      ownerStoreSlug: String(row.ownerStoreSlug ?? ""),
      salesCount: Number(row.salesCount ?? 0),
      earned,
      earnedLabel: formatMoney(earned, currency, tag),
    };
  });
}

/** Les ventes partenaires des deux côtés (source et partenaire). */
export async function listPartnerSales(
  storeId: string,
  currency: string,
  tag: string,
): Promise<PartnerSale[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("partner_sales")
    .select(
      [
        "id, amount, partner_commission, platform_commission, source_revenue, status, created_at",
        "order:orders!order_id(number)",
        "source:stores!source_store_id(name)",
        "partner:stores!partner_store_id(name)",
      ].join(", "),
    )
    .or(`source_store_id.eq.${storeId},partner_store_id.eq.${storeId}`)
    .order("created_at", { ascending: false })
    .limit(20);

  return ((data ?? []) as unknown as {
    id: string;
    amount: number;
    partner_commission: number;
    platform_commission: number;
    source_revenue: number;
    status: PartnerSale["status"];
    created_at: string;
    order: { number: number } | null;
    source: { name: string } | null;
    partner: { name: string } | null;
  }[]).map((row) => ({
    id: row.id,
    orderNumber: row.order?.number ?? 0,
    amountLabel: formatMoney(row.amount, currency, tag),
    partnerCommissionLabel: formatMoney(row.partner_commission, currency, tag),
    platformCommissionLabel: formatMoney(row.platform_commission, currency, tag),
    sourceRevenueLabel: formatMoney(row.source_revenue, currency, tag),
    status: row.status,
    sourceStoreName: row.source?.name ?? "",
    partnerStoreName: row.partner?.name ?? "",
    createdAt: row.created_at,
  }));
}
