"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/storefront/cart-provider";
import { Spinner } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { cn } from "@/lib/cn";

const BASE = [
  "absolute inset-x-3 bottom-3 z-10 flex h-10 items-center justify-center gap-1.5",
  "rounded-lg text-[0.75rem] font-medium shadow-sm backdrop-blur",
  "transition-all duration-300",
  "lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100",
  "lg:focus-visible:translate-y-0 lg:focus-visible:opacity-100",
].join(" ");

/**
 * Ajout rapide depuis la grille.
 *
 * Sans variante : ajout direct. Avec variantes, en rupture, numérique ou
 * service : renvoi vers la fiche, qui seule peut trancher.
 */
export function QuickAdd({
  productId,
  productSlug,
  productType,
  hasOptions,
  soldOut,
}: {
  productId: string;
  productSlug: string;
  productType: "physical" | "digital" | "service";
  hasOptions: boolean;
  soldOut: boolean;
}) {
  const { add, setOpen, labels, locale, slug } = useCart();
  const [adding, setAdding] = useState(false);
  const href = path(locale, `/store/${slug}/products/${productSlug}`);

  if (productType !== "physical") {
    return (
      <Link href={href} className={cn(BASE, "bg-surface/95 text-fg hover:bg-surface")}>
        {labels.viewProduct}
      </Link>
    );
  }

  if (soldOut) {
    return (
      <span className={cn(BASE, "bg-surface/70 text-faint")}>
        {labels.outOfStock}
      </span>
    );
  }

  if (hasOptions) {
    return (
      <Link href={href} className={cn(BASE, "bg-surface/95 text-fg hover:bg-surface")}>
        {labels.chooseOptions}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={adding}
      onClick={async () => {
        setAdding(true);
        const result = await add(productId, null, 1);
        setAdding(false);
        if (!result.ok) setOpen(true);
      }}
      className={cn(
        BASE,
        "bg-fg text-bg hover:bg-fg/90 disabled:opacity-70",
      )}
    >
      {adding ? (
        <>
          <Spinner />
          {labels.quickAdding}
        </>
      ) : (
        labels.quickAdd
      )}
    </button>
  );
}
