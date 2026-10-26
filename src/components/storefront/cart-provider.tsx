"use client";

import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import {
  addBundleToCartAction,
  addServiceToCartAction,
  addToCartAction,
  applyDiscountAction,
  removeCartItemAction,
  removeDiscountAction,
  updateCartItemAction,
} from "@/lib/storefront/cart-actions";
import type { CartItem, CartItemView, CartView } from "@/lib/storefront/cart-types";

type Labels = Dictionary["storefront"];

type CartContextValue = {
  cart: CartView | null;
  count: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  pending: boolean;
  error: string | null;
  add: (
    productId: string,
    variantId: string | null,
    quantity: number,
  ) => Promise<{ ok: boolean; error?: string }>;
  addBundle: (
    bundleId: string,
    quantity: number,
  ) => Promise<{ ok: boolean; error?: string }>;
  addService: (
    productId: string,
    startsAt: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  applyDiscount: (
    code: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  removeDiscount: () => Promise<{ ok: boolean; error?: string }>;
  update: (itemId: string, quantity: number) => void;
  remove: (itemId: string) => void;
  slug: string;
  locale: Locale;
  mediaBase: string;
  localeTag: string;
  labels: Labels;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart hors du CartProvider");
  return value;
}

/**
 * Panier de la vitrine, partagé par toutes les pages d'une boutique.
 *
 * L'état vient du serveur (cookie HttpOnly + RPC). Les actions renvoient le
 * panier recalculé : aucun montant n'est additionné dans le navigateur.
 */
export function CartProvider({
  slug,
  locale,
  initialCart,
  mediaBase,
  localeTag,
  labels,
  children,
}: {
  slug: string;
  locale: Locale;
  initialCart: CartView | null;
  mediaBase: string;
  localeTag: string;
  labels: Labels;
  children: ReactNode;
}) {
  const [cart, setCart] = useState<CartView | null>(initialCart);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const count = useMemo(
    () => (cart?.items ?? []).reduce((total, item) => total + item.quantity, 0),
    [cart],
  );

  async function add(
    productId: string,
    variantId: string | null,
    quantity: number,
  ): Promise<{ ok: boolean; error?: string }> {
    setError(null);

    const result = await addToCartAction({
      slug,
      productId,
      variantId,
      quantity,
      localeTag,
    });

    if (!result.cart) {
      setError(labels.addError);
      return { ok: false, error: result.error };
    }

    setCart(result.cart);

    if (result.error) {
      return { ok: false, error: result.error };
    }

    setOpen(true);
    return { ok: true };
  }

  async function addBundle(
    bundleId: string,
    quantity: number,
  ): Promise<{ ok: boolean; error?: string }> {
    setError(null);

    const result = await addBundleToCartAction({
      slug,
      bundleId,
      quantity,
      localeTag,
    });

    if (!result.cart) {
      setError(labels.addError);
      return { ok: false, error: result.error };
    }

    setCart(result.cart);

    if (result.error) {
      return { ok: false, error: result.error };
    }

    setOpen(true);
    return { ok: true };
  }

  async function applyDiscount(
    code: string,
  ): Promise<{ ok: boolean; error?: string }> {
    setError(null);

    const result = await applyDiscountAction({ code, localeTag });

    if (!result.cart) {
      return { ok: false, error: result.error };
    }

    setCart(result.cart);
    return { ok: true };
  }

  async function removeDiscount(): Promise<{ ok: boolean; error?: string }> {
    setError(null);

    const result = await removeDiscountAction({ localeTag });

    if (!result.cart) {
      return { ok: false, error: result.error };
    }

    setCart(result.cart);
    return { ok: true };
  }

  async function addService(
    productId: string,
    startsAt: string,
  ): Promise<{ ok: boolean; error?: string }> {
    setError(null);

    const result = await addServiceToCartAction({
      slug,
      productId,
      startsAt,
      localeTag,
    });

    if (!result.cart) {
      setError(labels.addError);
      return { ok: false, error: result.error };
    }

    setCart(result.cart);

    if (result.error) {
      return { ok: false, error: result.error };
    }

    setOpen(true);
    return { ok: true };
  }

  function update(itemId: string, quantity: number) {
    setError(null);
    startTransition(async () => {
      const result = await updateCartItemAction({ itemId, quantity, localeTag });
      if (result.cart) setCart(result.cart);
      else setError(labels.unavailable);
    });
  }

  function remove(itemId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeCartItemAction({ itemId, localeTag });
      if (result.cart) setCart(result.cart);
      else setError(labels.unavailable);
    });
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        count,
        open,
        setOpen,
        pending,
        error,
        add,
        addBundle,
        addService,
        applyDiscount,
        removeDiscount,
        update,
        remove,
        slug,
        locale,
        mediaBase,
        localeTag,
        labels,
      }}
    >
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

/** Bouton de l'en-tête : ouvre le tiroir, avec le nombre d'articles. */
export function CartButton() {
  const { count, setOpen, labels } = useCart();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={labels.cartOpen}
      title={labels.cartOpen}
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-body transition-colors hover:bg-hairline hover:text-fg"
    >
      <Icon path={icons.bag} className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} />
      {count > 0 ? (
        <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[0.625rem] font-semibold text-white">
          {count}
        </span>
      ) : null}
    </button>
  );
}

function CartDrawer() {
  const {
    cart,
    open,
    setOpen,
    pending,
    error,
    update,
    remove,
    slug,
    locale,
    mediaBase,
    labels,
  } = useCart();

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  if (!open) return null;

  const items = cart?.items ?? [];

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label={labels.cartClose}
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={labels.cartTitle}
        className="absolute inset-y-0 end-0 flex w-full flex-col border-s border-border bg-bg shadow-[-24px_0_60px_rgba(0,0,0,0.25)] sm:w-[26rem]"
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="flex items-baseline gap-2 text-[1.0625rem] font-medium text-fg">
            {labels.cartTitle}
            {items.length > 0 ? (
              <span className="text-[0.8125rem] font-normal text-subtle">
                ({items.length})
              </span>
            ) : null}
          </h2>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={labels.cartClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-faint transition-colors hover:bg-hairline hover:text-fg"
          >
            <Icon path={icons.close} className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface text-faint">
              <Icon path={icons.bag} className="h-6 w-6" strokeWidth={1.6} />
            </span>
            <p className="mt-4 text-[0.9375rem] font-medium text-fg">
              {labels.cartEmptyTitle}
            </p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted">
              {labels.cartEmptyText}
            </p>
            <Link
              href={path(locale, `/store/${slug}`)}
              onClick={() => setOpen(false)}
              className="mt-5 rounded-xl bg-brand-500 px-5 py-2.5 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-600"
            >
              {labels.continueShopping}
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-5">
              {items.map((item) => (
                <DrawerLine
                  key={item.id}
                  item={item}
                  pending={pending}
                  mediaBase={mediaBase}
                  labels={labels}
                  update={update}
                  remove={remove}
                />
              ))}
            </ul>

            <footer className="border-t border-border px-5 py-4">
              {error ? (
                <p role="alert" className="mb-3 text-[0.75rem] text-red-500 dark:text-red-400">
                  {error}
                </p>
              ) : null}

              <dl className="space-y-1.5 text-[0.8125rem]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-subtle">{labels.subtotal}</dt>
                  <dd className="font-medium tabular-nums text-fg">
                    {cart?.subtotalLabel ?? "—"}
                  </dd>
                </div>
                {cart?.discountAmountLabel ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-subtle">
                      {labels.discountLabel}
                      {cart.discount ? ` (${cart.discount.code})` : ""}
                    </dt>
                    <dd className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                      −{cart.discountAmountLabel}
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-subtle">{labels.shipping}</dt>
                  <dd className="font-medium tabular-nums text-fg">
                    {(cart?.shipping ?? 0) === 0
                      ? labels.freeShipping
                      : (cart?.shippingLabel ?? "—")}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-hairline pt-2 text-[0.9375rem]">
                  <dt className="font-medium text-fg">{labels.total}</dt>
                  <dd className="font-semibold tabular-nums text-fg">
                    {cart?.totalLabel ?? "—"}
                  </dd>
                </div>
              </dl>

              {cart && !cart.codEligible ? (
                <p className="mt-3 rounded-lg border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2 text-[0.75rem] leading-relaxed text-amber-700 dark:text-amber-300">
                  {labels.cartCodUnavailable}
                </p>
              ) : null}

              {cart?.codEligible ? (
                <Link
                  href={path(locale, `/store/${slug}/checkout`)}
                  onClick={() => setOpen(false)}
                  className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-brand-500 text-[0.875rem] font-medium text-white transition-colors hover:bg-brand-600"
                >
                  {labels.checkout}
                </Link>
              ) : (
                <span className="mt-4 flex h-11 w-full cursor-not-allowed items-center justify-center rounded-xl bg-hairline text-[0.875rem] font-medium text-faint">
                  {labels.checkout}
                </span>
              )}

              <Link
                href={path(locale, `/store/${slug}/cart`)}
                onClick={() => setOpen(false)}
                className="mt-2 flex h-10 w-full items-center justify-center rounded-xl text-[0.8125rem] font-medium text-subtle transition-colors hover:text-fg"
              >
                {labels.viewCart}
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

function DrawerLine({
  item,
  pending,
  mediaBase,
  labels,
  update,
  remove,
}: {
  item: CartItemView;
  pending: boolean;
  mediaBase: string;
  labels: Labels;
  update: (itemId: string, quantity: number) => void;
  remove: (itemId: string) => void;
}) {
  return (
    <li className="flex gap-3 border-b border-hairline py-4 last:border-0">
      <CartThumb item={item} mediaBase={mediaBase} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="flex min-w-0 items-center gap-2 text-[0.875rem] font-medium text-fg">
            <span className="truncate">{item.name}</span>
            {item.kind === "bundle" ? (
              <span className="shrink-0 rounded-full bg-brand-500/10 px-1.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-wide text-accent">
                {labels.bundleCartBadge}
              </span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={() => remove(item.id)}
            disabled={pending}
            aria-label={labels.remove}
            title={labels.remove}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-faint transition-colors hover:bg-hairline hover:text-fg"
          >
            <Icon path={icons.trash} className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>

        {item.variantLabel ? (
          <p className="mt-0.5 truncate text-[0.75rem] text-subtle">
            {item.variantLabel}
          </p>
        ) : null}

        {item.kind === "bundle" ? (
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[0.75rem] tabular-nums text-subtle">
            <span>{item.unitPriceLabel}</span>
            {item.compareAtLabel ? (
              <span className="text-faint line-through">{item.compareAtLabel}</span>
            ) : null}
          </p>
        ) : null}

        {item.serviceStartsAtLabel ? (
          <p className="mt-0.5 flex items-center gap-1.5 text-[0.75rem] text-subtle">
            <Icon path={icons.calendar} className="h-3.5 w-3.5" strokeWidth={1.8} />
            {item.serviceStartsAtLabel}
          </p>
        ) : null}

        {!item.available ? (
          <p className="mt-1 text-[0.75rem] font-medium text-red-500">
            {labels.cartItemUnavailable}
          </p>
        ) : null}

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <QuantityStepper
            item={item}
            pending={pending}
            labels={labels}
            update={update}
          />
          <span className="text-[0.875rem] font-medium tabular-nums text-fg">
            {item.lineTotalLabel}
          </span>
        </div>
      </div>
    </li>
  );
}

export function QuantityStepper({
  item,
  pending,
  labels,
  update,
  size = "sm",
}: {
  item: CartItemView;
  pending: boolean;
  labels: Labels;
  update: (itemId: string, quantity: number) => void;
  size?: "sm" | "md";
}) {
  const max = item.stock ?? 99;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-surface",
        size === "sm" ? "h-8" : "h-10",
      )}
    >
      <button
        type="button"
        onClick={() => update(item.id, item.quantity - 1)}
        disabled={pending || item.quantity <= 1}
        aria-label={`${labels.quantity} −`}
        className="flex h-full w-8 items-center justify-center text-subtle transition-colors hover:text-fg disabled:opacity-35"
      >
        <span aria-hidden="true" className="text-[1rem] leading-none">−</span>
      </button>

      <span
        aria-label={labels.quantity}
        className="min-w-7 text-center text-[0.8125rem] font-medium tabular-nums text-fg"
      >
        {item.quantity}
      </span>

      <button
        type="button"
        onClick={() => update(item.id, item.quantity + 1)}
        disabled={pending || item.quantity >= max}
        aria-label={`${labels.quantity} +`}
        className="flex h-full w-8 items-center justify-center text-subtle transition-colors hover:text-fg disabled:opacity-35"
      >
        <span aria-hidden="true" className="text-[1rem] leading-none">+</span>
      </button>
    </div>
  );
}

export function CartThumb({
  item,
  mediaBase,
  wide = false,
}: {
  item: CartItem;
  mediaBase: string;
  wide?: boolean;
}) {
  if (item.imageKey) {
    return (
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-lg border border-border bg-hairline",
          wide ? "h-20 w-16" : "h-16 w-14",
        )}
      >
        <Image
          src={`${mediaBase}/${item.imageKey}`}
          alt=""
          fill
          sizes="80px"
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-faint",
        wide ? "h-20 w-16" : "h-16 w-14",
      )}
    >
      <Icon path={icons.tag} className="h-4 w-4" strokeWidth={1.7} />
    </span>
  );
}
