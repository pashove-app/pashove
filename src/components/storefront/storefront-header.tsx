import { StoreMonogram } from "@/components/storefront/store-monogram";
import type { PublicStore } from "@/lib/storefront/queries";

/**
 * En-tête de la vitrine.
 *
 * Volontairement sobre : le nom et le logo, rien d'autre. La navigation, la
 * recherche et le panier viendront quand les produits existeront.
 */
export function StorefrontHeader({ store }: { store: PublicStore }) {
  return (
    <header className="flex items-center gap-3 border-b border-border py-5">
      <StoreMonogram name={store.name} size="sm" />
      <span className="min-w-0 truncate text-[1.0625rem] font-medium tracking-[-0.02em] text-fg">
        {store.name}
      </span>
    </header>
  );
}
