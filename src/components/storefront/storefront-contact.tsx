import { Icon, icons } from "@/components/ui/primitives";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { PublicStore } from "@/lib/storefront/queries";

/**
 * Contact public de la boutique.
 *
 * Uniquement ce que le marchand a décidé de publier : jamais le téléphone de
 * son profil, qui n'a pas été donné pour ça. La section disparaît si rien
 * n'est renseigné.
 */
export function StorefrontContact({
  t,
  store,
}: {
  t: Dictionary;
  store: PublicStore;
}) {
  if (!store.contact_email && !store.contact_phone) return null;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-subtle">
        {t.storefront.contactTitle}
      </h2>

      <div className="mt-4 flex flex-wrap gap-3">
        {store.contact_email ? (
          <a
            href={`mailto:${store.contact_email}`}
            aria-label={t.storefront.contactEmail}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-border-soft bg-hairline px-4 py-2.5 text-[0.8125rem] text-body transition-colors hover:border-border-strong"
          >
            <Icon path={icons.mail} className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} />
            <span dir="ltr" className="truncate">
              {store.contact_email}
            </span>
          </a>
        ) : null}

        {store.contact_phone ? (
          <a
            href={`tel:${store.contact_phone}`}
            aria-label={t.storefront.contactPhone}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-border-soft bg-hairline px-4 py-2.5 text-[0.8125rem] text-body transition-colors hover:border-border-strong"
          >
            <Icon path={icons.phone} className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} />
            <span dir="ltr" className="truncate">
              {store.contact_phone}
            </span>
          </a>
        ) : null}
      </div>
    </section>
  );
}
