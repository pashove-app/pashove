import { NextResponse } from "next/server";
import { emailAbandonedCart } from "@/lib/email/events";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type Reminder = {
  id: string;
  email: string;
  cart_id: string;
  store_id: string;
};

type Cart = {
  token: string;
  status: string;
  updated_at: string;
  expires_at: string;
  stores: { name: string; slug: string; currency: string } | null;
  cart_items: {
    quantity: number;
    products: { name: string; price_amount: number } | null;
  }[];
};

/** Rappel unique des paniers abandonnés ayant reçu un opt-in explicite. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: "service_role_missing" }, { status: 503 });
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await service
    .from("cart_reminders")
    .select("id, email, cart_id, store_id")
    .eq("status", "pending")
    .lte("created_at", cutoff)
    .limit(30);

  const reminders = (data ?? []) as Reminder[];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const reminder of reminders) {
    const { data: cartData } = await service
      .from("carts")
      .select(
        "token, status, updated_at, expires_at, stores(name, slug, currency), cart_items(quantity, products(name, price_amount))",
      )
      .eq("id", reminder.cart_id)
      .maybeSingle();

    const cart = cartData as Cart | null;

    if (
      !cart ||
      cart.status !== "open" ||
      cart.updated_at > cutoff ||
      new Date(cart.expires_at) <= new Date() ||
      !cart.stores
    ) {
      await service
        .from("cart_reminders")
        .update({ status: "cancelled" })
        .eq("id", reminder.id);
      skipped += 1;
      continue;
    }

    const items = cart.cart_items
      .filter((item) => item.products)
      .map((item) => ({
        name: item.products!.name,
        quantity: item.quantity,
        lineTotal: item.products!.price_amount * item.quantity,
      }));

    if (items.length === 0) {
      await service
        .from("cart_reminders")
        .update({ status: "cancelled" })
        .eq("id", reminder.id);
      skipped += 1;
      continue;
    }

    try {
      await emailAbandonedCart({
        to: reminder.email,
        name: reminder.email.split("@")[0],
        storeId: reminder.store_id,
        storeName: cart.stores.name,
        storeSlug: cart.stores.slug,
        cartToken: cart.token,
        currency: cart.stores.currency,
        total: items.reduce((sum, item) => sum + item.lineTotal, 0),
        items,
        locale: "fr",
      });

      await service
        .from("cart_reminders")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", reminder.id);
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return NextResponse.json({ processed: reminders.length, sent, skipped, failed });
}
