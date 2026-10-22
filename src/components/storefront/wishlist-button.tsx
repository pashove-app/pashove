"use client";

import { useCart } from "@/components/storefront/cart-provider";
import { useWishlist } from "@/components/storefront/wishlist-provider";
import { cn } from "@/lib/cn";

/**
 * Cœur de favori. Le clic est mémorisé localement, par boutique ; aucune
 * page de gestion pour l'instant.
 */
export function WishlistButton({
  productId,
  variant = "circle",
  className,
}: {
  productId: string;
  variant?: "circle" | "square";
  className?: string;
}) {
  const { labels } = useCart();
  const { has, toggle } = useWishlist();
  const active = has(productId);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? labels.wishlistRemove : labels.wishlistAdd}
      title={active ? labels.wishlistRemove : labels.wishlistAdd}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(productId);
      }}
      className={cn(
        "flex items-center justify-center transition-colors",
        variant === "circle"
          ? "h-9 w-9 rounded-full bg-surface/90 shadow-sm backdrop-blur hover:bg-surface"
          : "h-12 w-12 rounded-xl border border-border bg-surface hover:border-border-strong",
        active ? "text-red-500" : "text-fg",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[1.125rem] w-[1.125rem]"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20.5s-7.2-4.4-9.4-8.2C.9 9 2.5 5.2 6.2 5.2c2.1 0 3.6 1.2 4.5 2.5.9-1.3 2.4-2.5 4.5-2.5 3.7 0 5.3 3.8 3.6 7.1C16.9 16.1 12 20.5 12 20.5Z" />
      </svg>
    </button>
  );
}
