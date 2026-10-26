"use client";

import { useEffect } from "react";
import { useCart } from "@/components/storefront/cart-provider";

/** Vide l'état client du panier après une commande, sans recharger la page. */
export function CartReset() {
  const { reset } = useCart();

  useEffect(() => {
    reset();
  }, [reset]);

  return null;
}
