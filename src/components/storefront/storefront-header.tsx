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
      {store.logo_url ? (
        // URL fournie par le marchand, hors des domaines configurés pour
        // `next/image` : on l'affiche telle quelle, sans optimisation.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={store.logo_url}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-10 w-10 shrink-0 rounded-xl border border-border-soft object-cover"
        />
      ) : (
        <StoreMonogram name={store.name} size="sm" />
      )}

      <span className="min-w-0 truncate text-[1.0625rem] font-medium tracking-[-0.02em] text-fg">
        {store.name}
      </span>
    </header>
  );
}
