import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { afterDeliveryPush } from "@/lib/pwa/after-push";
import {
  SasPayError,
  verifyPayment,
  WEBHOOK_TOLERANCE_SECONDS,
  webhookSecret,
} from "@/lib/payments/saspay/client";

export const dynamic = "force-dynamic";

type SasPayEvent = {
  event?: string;
  data?: {
    id?: string;
    reference?: string;
    status?: string;
    amount?: string | number;
    currency?: string;
  };
};

function parseAmount(value: unknown): number | null {
  const raw =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(raw)) return null;
  return Math.round(raw * 100) / 100;
}

/**
 * Webhook SasPay.
 *
 * Signature : HMAC-SHA256(signing_secret, `timestamp + "." + corps brut`),
 * horodatage toléré à 300 s, comparaison à temps constant.
 *
 * La confirmation n'est jamais décidée ici : la RPC compare le montant reçu au
 * total de la commande avant d'écrire au ledger, et elle est idempotente.
 */
export async function POST(request: Request) {
  const secret = webhookSecret();
  if (!secret) {
    console.error("[saspay] SASPAY_WEBHOOK_SECRET manquante");
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-webhook-signature");
  const timestamp = request.headers.get("x-webhook-timestamp");

  if (!signature || !timestamp) {
    return NextResponse.json({ error: "missing_signature" }, { status: 401 });
  }

  const sentAt = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);

  if (!Number.isFinite(sentAt) || Math.abs(now - sentAt) > WEBHOOK_TOLERANCE_SECONDS) {
    return NextResponse.json({ error: "stale_timestamp" }, { status: 401 });
  }

  const expected = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex");
  const received = signature.trim().replace(/^sha256=/i, "").toLowerCase();
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: SasPayEvent;
  try {
    payload = JSON.parse(raw) as SasPayEvent;
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const event = payload.event ?? "";
  const data = payload.data ?? {};
  const reference = typeof data.id === "string" ? data.id.trim() : "";

  if (!reference) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: "service_role_missing" }, { status: 503 });
  }

  const fee = parseAmount((data as { fee?: unknown }).fee);
  const net = parseAmount((data as { net_amount?: unknown }).net_amount);

  if (event === "transaction.success") {
    let amount = parseAmount(data.amount);
    let currency = typeof data.currency === "string" ? data.currency : "";

    // Le webhook peut arriver sans montant : on relit alors la transaction
    // réelle chez SasPay plutôt que de confirmer à l'aveugle.
    if (amount === null || !currency) {
      try {
        const payment = await verifyPayment(reference);
        amount = parseAmount((payment as { requested_amount?: unknown }).requested_amount);
        currency =
          typeof payment.currency === "string" ? payment.currency : currency;
      } catch (error) {
        if (error instanceof SasPayError) {
          console.error("[saspay] verify after webhook failed", error.code);
        }
        return NextResponse.json({ error: "verification_failed" }, { status: 502 });
      }
    }

    if (amount === null || !currency) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const { data: result, error } = await service.rpc("confirm_saspay_payment", {
      p_reference: reference,
      p_amount: amount,
      p_currency: currency,
      p_fee: fee ?? 0,
      p_net: net,
    });

    if (error) {
      console.error("[saspay] confirm failed", error.message);
      return NextResponse.json({ error: "confirm_failed" }, { status: 500 });
    }

    const outcome = result as { status?: string; reason?: string } | null;

    // La confirmation a pu créer une course et la dispatcher. L'offre ne dure
    // que 10 secondes : on draine les notifications dès la réponse envoyée.
    afterDeliveryPush();

    // Ce n'est pas une commande : peut-être un paiement d'abonnement.
    if (outcome?.status === "ignored" && outcome.reason === "payment_unknown") {
      const { data: planResult, error: planError } = await service.rpc(
        "confirm_plan_payment",
        {
          p_reference: reference,
          p_amount: amount,
          p_currency: currency,
        },
      );

      if (planError) {
        console.error("[saspay] plan confirm failed", planError.message);
        return NextResponse.json({ error: "plan_confirm_failed" }, { status: 500 });
      }

      const planOutcome = planResult as {
        status?: string;
        reason?: string;
      } | null;

      // Ni commande ni abonnement : peut-être une recharge Studio.
      if (planOutcome?.status === "ignored") {
        const { data: studioResult, error: studioError } = await service.rpc(
          "confirm_studio_topup",
          {
            p_reference: reference,
            p_amount: amount,
            p_currency: currency,
          },
        );

        if (studioError) {
          console.error("[saspay] studio confirm failed", studioError.message);
          return NextResponse.json(
            { error: "studio_confirm_failed" },
            { status: 500 },
          );
        }

        return NextResponse.json({ received: true, studio: studioResult });
      }

      return NextResponse.json({ received: true, plan: planResult });
    }

    return NextResponse.json({ received: true, result });
  }

  if (event === "transaction.failed" || event === "transaction.cancelled") {
    await service.rpc("fail_plan_payment", { p_reference: reference });
    await service.rpc("fail_studio_topup", { p_reference: reference });

    const { error } = await service.rpc("fail_saspay_payment", {
      p_reference: reference,
    });

    if (error) {
      console.error("[saspay] fail failed", error.message);
      return NextResponse.json({ error: "fail_failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true, ignored: true });
}
