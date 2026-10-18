import Image from "next/image";
import { BRAND_GRADIENT, BRAND_GRID } from "@/components/storefront/brand";
import { publicUrl } from "@/lib/r2/media";
import type { PublicStore } from "@/lib/storefront/queries";

/**
 * Bandeau de la vitrine.
 *
 * Sans bannière téléversée, il reprend l'aplat de l'onboarding — la boutique a
 * ainsi l'air finie dès sa publication. L'image prendra sa place au lot média,
 * dans le même cadre.
 */
export function StorefrontHero({ store }: { store: PublicStore }) {
  return (
    <div>
      <div className="relative h-40 overflow-hidden rounded-3xl sm:h-60">
        {store.banner ? (
          <Image
            src={publicUrl(store.banner.object_key)}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        ) : (
          <>
            <div className={`absolute inset-0 ${BRAND_GRADIENT}`} aria-hidden="true" />
            <div className={`absolute inset-0 ${BRAND_GRID}`} aria-hidden="true" />

            <svg
              viewBox="0 0 40 40"
              fill="none"
              aria-hidden="true"
              focusable="false"
              className="absolute end-[-3%] top-1/2 w-[44%] max-w-[20rem] -translate-y-1/2 text-white/[0.16]"
            >
              <path
                d="M10.5 19.5 20 10l9.5 9.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.5 28 20 21.5 26.5 28"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
      </div>

      {store.description ? (
        <p className="mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
          {store.description}
        </p>
      ) : null}
    </div>
  );
}
