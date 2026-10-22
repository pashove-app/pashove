import Image from "next/image";
import { CartButton } from "@/components/storefront/cart-provider";
import { StoreMonogram } from "@/components/storefront/store-monogram";
import { publicUrl } from "@/lib/r2/media";
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
      {store.logo ? (
        <Image
          src={publicUrl(store.logo.object_key)}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-xl border border-border-soft object-cover"
        />
      ) : (
        <StoreMonogram name={store.name} size="sm" />
      )}

      <span className="min-w-0 flex-1 truncate text-[1.0625rem] font-medium tracking-[-0.02em] text-fg">
        {store.name}
      </span>

      <CartButton />
    </header>
  );
}
