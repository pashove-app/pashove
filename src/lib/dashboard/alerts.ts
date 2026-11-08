import type { Store } from "@/lib/stores/queries";
import { orderCounts } from "@/lib/orders/queries";
import { lowStockProducts, type LowStockProduct } from "@/lib/products/queries";
import { getStoreBalances } from "@/lib/finance/queries";
import { getCurrentPlan } from "@/lib/plans/queries";

export type DashboardAlerts = {
  ordersToShip: number;
  lowStock: LowStockProduct[];
  available: number;
  currency: string;
  planCode: string;
  planExpiresAt: string | null;
  planDaysLeft: number | null;
};

function daysUntil(value: string | null): number | null {
  if (!value) return null;
  const end = new Date(value).getTime();
  if (!Number.isFinite(end)) return null;
  return Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000));
}

/** Données réelles des actions rapides du tableau de bord. */
export async function getDashboardAlerts(store: Store): Promise<DashboardAlerts> {
  const [counts, lowStock, balances, plan] = await Promise.all([
    orderCounts(store.id, null),
    lowStockProducts(store.id),
    getStoreBalances(store.id),
    getCurrentPlan(),
  ]);

  return {
    ordersToShip: (counts.pending ?? 0) + (counts.preparing ?? 0),
    lowStock,
    available: balances.available,
    currency: store.currency,
    planCode: plan?.code ?? "free",
    planExpiresAt: plan?.expiresAt ?? null,
    planDaysLeft: daysUntil(plan?.expiresAt ?? null),
  };
}
