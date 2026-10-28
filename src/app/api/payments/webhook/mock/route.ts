import { NextResponse } from "next/server";
import { MockProvider } from "@/lib/payments/mock";
import { createPublicClient } from "@/lib/supabase/public";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Webhook du fournisseur Mock.
 *
 * La signature HMAC est vérifiée avant tout accès à la commande, exactement
 * comme le fera le webhook Flutterwave. La confirmation est idempotente.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-pashove-signature");
  const provider = new MockProvider();

  let event;
  try {
    event = await provider.handleWebhook(raw, signature);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  if (event.status !== "succeeded" || !UUID_PATTERN.test(event.orderToken)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const supabase = createPublicClient();
  const { error } = await supabase.rpc("confirm_mock_payment", {
    p_order_token: event.orderToken,
    p_reference: event.reference,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  return NextResponse.json({ received: true });
}
