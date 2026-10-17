import { Icon, icons } from "@/components/ui/primitives";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Les produits de la visite.
 *
 * La grille accueillera les fiches au lot suivant. En attendant, l'écran vide
 * dit quelque chose de vrai — la boutique prépare sa collection — sans inviter
 * le visiteur à une action qu'il ne peut pas faire.
 */
export function ProductGrid({ t }: { t: Dictionary }) {
  return (
    <section className="mt-12">
      <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-subtle">
        {t.storefront.productsTitle}
      </h2>

      <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-14 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface text-faint">
          <Icon path={icons.box} className="h-5 w-5" strokeWidth={1.7} />
        </span>

        <p className="mt-4 text-[0.9375rem] font-medium text-fg">
          {t.storefront.emptyTitle}
        </p>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted">
          {t.storefront.emptyText}
        </p>
      </div>
    </section>
  );
}
