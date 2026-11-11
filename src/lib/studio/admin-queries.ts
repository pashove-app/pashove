import { createClient } from "@/lib/supabase/server";
import type {
  StudioBalance,
  StudioGeneration,
  StudioPrice,
  StudioTopup,
} from "@/lib/studio/types";

export type StudioOverview = {
  recharged: number;
  spent: number;
  cost: number;
  margin: number;
  balances: number;
  merchants: number;
};

export type AdminStudioMerchant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  balanceFcfa: number;
  totalRecharged: number;
  totalSpent: number;
  lastGenerationAt: string | null;
};

export type AdminStudioGeneration = StudioGeneration & {
  costRealFcfa: number;
  marginFcfa: number;
};

export type StudioMerchantDetail = {
  store: {
    id: string;
    name: string;
    slug: string;
    status: string;
    currency: string;
    country: string;
    createdAt: string;
  };
  balance: StudioBalance;
  topups: StudioTopup[];
  generations: AdminStudioGeneration[];
};

export async function adminStudioOverview(): Promise<StudioOverview> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_studio_overview");

  if (error || !data) {
    if (error) console.error("[studio] overview failed", error.message);
    return {
      recharged: 0,
      spent: 0,
      cost: 0,
      margin: 0,
      balances: 0,
      merchants: 0,
    };
  }

  const row = data as Record<string, number>;

  return {
    recharged: Number(row.recharged ?? 0),
    spent: Number(row.spent ?? 0),
    cost: Number(row.cost ?? 0),
    margin: Number(row.margin ?? 0),
    balances: Number(row.balances ?? 0),
    merchants: Number(row.merchants ?? 0),
  };
}

export async function adminStudioPricing(): Promise<StudioPrice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("studio_pricing")
    .select("action_type, price_fcfa, label, description")
    .order("price_fcfa", { ascending: true });

  if (error) {
    console.error("[studio] pricing failed", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    actionType: row.action_type,
    priceFcfa: row.price_fcfa,
    label: row.label,
    description: row.description,
  }));
}

export async function listStudioMerchants(): Promise<AdminStudioMerchant[]> {
  const supabase = await createClient();

  const [storesResult, balancesResult, generationsResult] = await Promise.all([
    supabase
      .from("stores")
      .select("id, name, slug, status")
      .order("name", { ascending: true }),
    supabase
      .from("store_studio_balance")
      .select("store_id, balance_fcfa, total_recharged, total_spent"),
    supabase
      .from("studio_generations")
      .select("store_id, created_at")
      .order("created_at", { ascending: false }),
  ]);

  if (storesResult.error) {
    console.error("[studio] merchants failed", storesResult.error.message);
    return [];
  }

  const balances = new Map(
    (balancesResult.data ?? []).map((row) => [row.store_id, row]),
  );

  const lastGeneration = new Map<string, string>();
  for (const row of generationsResult.data ?? []) {
    if (!lastGeneration.has(row.store_id)) {
      lastGeneration.set(row.store_id, row.created_at);
    }
  }

  return (storesResult.data ?? [])
    .map((store) => {
      const balance = balances.get(store.id);
      return {
        id: store.id,
        name: store.name,
        slug: store.slug,
        status: store.status,
        balanceFcfa: balance?.balance_fcfa ?? 0,
        totalRecharged: balance?.total_recharged ?? 0,
        totalSpent: balance?.total_spent ?? 0,
        lastGenerationAt: lastGeneration.get(store.id) ?? null,
      };
    })
    .sort((a, b) => b.balanceFcfa - a.balanceFcfa || a.name.localeCompare(b.name));
}

export async function getStudioMerchantDetail(
  storeId: string,
): Promise<StudioMerchantDetail | null> {
  const supabase = await createClient();

  const { data: store, error } = await supabase
    .from("stores")
    .select("id, name, slug, status, currency, country, created_at")
    .eq("id", storeId)
    .maybeSingle();

  if (error || !store) return null;

  const [balanceResult, topupsResult, generationsResult] = await Promise.all([
    supabase
      .from("store_studio_balance")
      .select("balance_fcfa, total_recharged, total_spent")
      .eq("store_id", storeId)
      .maybeSingle(),
    supabase
      .from("studio_topups")
      .select(
        "id, amount_fcfa, status, provider, note, created_at, paid_at",
      )
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("studio_generations")
      .select(
        "id, action_type, prompt, price_paid_fcfa, cost_real_fcfa, margin_fcfa, status, result_text, video_url, created_at, completed_at",
      )
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return {
    store: {
      id: store.id,
      name: store.name,
      slug: store.slug,
      status: store.status,
      currency: store.currency,
      country: store.country,
      createdAt: store.created_at,
    },
    balance: balanceResult.data
      ? {
          balanceFcfa: balanceResult.data.balance_fcfa,
          totalRecharged: balanceResult.data.total_recharged,
          totalSpent: balanceResult.data.total_spent,
        }
      : { balanceFcfa: 0, totalRecharged: 0, totalSpent: 0 },
    topups: (topupsResult.data ?? []).map((row) => ({
      id: row.id,
      amountFcfa: row.amount_fcfa,
      status: row.status,
      provider: row.provider,
      note: row.note,
      createdAt: row.created_at,
      paidAt: row.paid_at,
    })),
    generations: (generationsResult.data ?? []).map((row) => ({
      id: row.id,
      actionType: row.action_type,
      prompt: row.prompt,
      pricePaidFcfa: row.price_paid_fcfa,
      costRealFcfa: row.cost_real_fcfa,
      marginFcfa: row.margin_fcfa,
      status: row.status,
      resultText: row.result_text,
      videoUrl: row.video_url,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    })),
  };
}
