"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CART_COOKIE, isCartToken } from "@/lib/storefront/cart";
import { createServiceClient } from "@/lib/supabase/service";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Reprise d'un paiement en ligne échoué.
 *
 * La compensation (stock, commande, panier) est idempotente côté base. On
 * récupère le panier rouvert, on repose le cookie et on renvoie le client au
 * checkout. Le jeton de commande présent dans l'URL sert de preuve.
 */
export async function retryOrderPaymentAction(formData: FormData): Promise<void> {
  const orderId = field(formData, "orderId");
  const locale = field(formData, "locale") || "fr";
  const slug = field(formData, "slug");

  const failurePath = `/${locale}/store/${slug}/checkout/success/${orderId}`;

  if (!orderId || !slug) redirect(failurePath);

  const service = createServiceClient();
  if (!service) redirect(failurePath);

  const { data, error } = await service.rpc("fail_online_order", {
    p_order_token: orderId,
    p_reason: "retry",
  });

  const cartToken = (data as { cartToken?: string } | null)?.cartToken;

  if (error || !isCartToken(cartToken)) {
    if (error) {
      console.error("[checkout] retry compensation failed", error.message);
    }
    redirect(failurePath);
  }

  (await cookies()).set(CART_COOKIE, cartToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(`/${locale}/store/${slug}/checkout`);
}
