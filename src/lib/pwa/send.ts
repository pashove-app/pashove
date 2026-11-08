import { sendNotification, setVapidDetails } from "web-push";
import { createServiceClient } from "@/lib/supabase/service";
import { currencyDecimals } from "@/lib/fx/currency";

/**
 * Envoi des notifications push du livreur.
 *
 * Le dispatch SQL écrit une ligne dans `delivery_push_jobs` au moment où une
 * offre est assignée. Ce module la draine immédiatement après le webhook ou
 * l'action qui vient de dispatcher — l'offre ne dure que 10 secondes.
 *
 * Les endpoints push sont des capacités secrètes : on ne les journalise jamais,
 * seulement leur identifiant interne et le code de réponse.
 */

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export type PushSendResult = {
  configured: boolean;
  subscriptions: number;
  sent: number;
  failed: number;
  removed: number;
};

export type DeliveryPushSummary = {
  configured: boolean;
  candidates: number;
  claimed: number;
  sent: number;
  failed: number;
  removed: number;
  cancelled: number;
};

type SubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type JobRow = {
  id: string;
  delivery_id: string;
  courier_user_id: string;
  store_name: string;
  fee_amount: number;
  currency: string;
  attempts: number;
};

const EMPTY_RESULT: PushSendResult = {
  configured: false,
  subscriptions: 0,
  sent: 0,
  failed: 0,
  removed: 0,
};

let vapidConfigured = false;

function configureVapid(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) return false;

  if (!vapidConfigured) {
    const contact = process.env.EMAIL_REPLY_TO?.trim() || "hello@pashove.com";
    try {
      setVapidDetails(`mailto:${contact}`, publicKey, privateKey);
      vapidConfigured = true;
    } catch (error) {
      console.error("[push] invalid VAPID keys", errorMessage(error));
      return false;
    }
  }

  return true;
}

function errorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const status = (error as { statusCode?: unknown }).statusCode;
  return typeof status === "number" ? status : undefined;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 300);
  return String(error).slice(0, 300);
}

/**
 * Envoie une notification à tous les appareils abonnés d'un utilisateur.
 * Un abonnement qui répond 404/410 est définitivement mort : on le supprime.
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload,
): Promise<PushSendResult> {
  if (!configureVapid()) {
    console.warn("[push] VAPID keys missing, notification skipped");
    return EMPTY_RESULT;
  }

  const service = createServiceClient();
  if (!service) {
    console.warn("[push] service role missing, notification skipped");
    return EMPTY_RESULT;
  }

  const { data, error } = await service
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    console.error("[push] subscription read failed", error.message);
    return { ...EMPTY_RESULT, configured: true };
  }

  const subscriptions = (data ?? []) as SubscriptionRow[];
  const body = JSON.stringify(payload);

  let sent = 0;
  let failed = 0;
  let removed = 0;

  for (const subscription of subscriptions) {
    try {
      await sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        body,
        { TTL: 60, urgency: "high" },
      );
      sent += 1;
    } catch (sendError) {
      const status = errorStatus(sendError);

      if (status === 404 || status === 410) {
        await service.from("push_subscriptions").delete().eq("id", subscription.id);
        removed += 1;
        console.info("[push] expired subscription removed", {
          subscriptionId: subscription.id,
          status,
        });
      } else {
        failed += 1;
        console.error("[push] send failed", {
          subscriptionId: subscription.id,
          status,
          message: errorMessage(sendError),
        });
      }
    }
  }

  if (sent > 0) {
    console.info("[push] notification sent", {
      userId,
      subscriptions: subscriptions.length,
      sent,
      failed,
      removed,
      tag: payload.tag,
    });
  }

  return {
    configured: true,
    subscriptions: subscriptions.length,
    sent,
    failed,
    removed,
  };
}

/**
 * Envoie les notifications de course en attente, puis solde les lignes.
 * Idempotent : chaque ligne est prise par un UPDATE conditionnel avant l'envoi.
 */
export async function drainDeliveryPush(limit = 20): Promise<DeliveryPushSummary> {
  const summary: DeliveryPushSummary = {
    configured: false,
    candidates: 0,
    claimed: 0,
    sent: 0,
    failed: 0,
    removed: 0,
    cancelled: 0,
  };

  if (!configureVapid()) return summary;

  const service = createServiceClient();
  if (!service) return summary;

  summary.configured = true;
  const now = new Date().toISOString();

  // Les offres déjà expirées ne doivent jamais réveiller un téléphone.
  const { data: cancelled, error: cancelError } = await service
    .from("delivery_push_jobs")
    .update({ status: "cancelled", last_error: "offer_expired" })
    .eq("status", "pending")
    .lte("expires_at", now)
    .select("id");

  if (cancelError) {
    console.error("[push] expire jobs failed", cancelError.message);
  } else {
    summary.cancelled = cancelled?.length ?? 0;
  }

  const { data: jobs, error } = await service
    .from("delivery_push_jobs")
    .select(
      "id, delivery_id, courier_user_id, store_name, fee_amount, currency, attempts",
    )
    .eq("status", "pending")
    .gt("expires_at", now)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[push] job read failed", error.message);
    return summary;
  }

  const rows = (jobs ?? []) as JobRow[];
  summary.candidates = rows.length;

  for (const job of rows) {
    const { data: claimed } = await service
      .from("delivery_push_jobs")
      .update({ status: "sending", attempts: job.attempts + 1 })
      .eq("id", job.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (!claimed) continue;
    summary.claimed += 1;

    const result = await sendPushNotification(job.courier_user_id, {
      title: "Nouvelle course disponible !",
      body: `${job.store_name} - ${priceLabel(job.fee_amount, job.currency)}`,
      url: "/app/courier",
      tag: `delivery-${job.delivery_id}`,
    });

    summary.removed += result.removed;

    if (result.sent > 0) {
      summary.sent += 1;
      await service
        .from("delivery_push_jobs")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", job.id);

      console.info("[push] delivery sent", {
        jobId: job.id,
        deliveryId: job.delivery_id,
        devices: result.sent,
      });
    } else {
      summary.failed += 1;
      const reason =
        result.subscriptions === 0 ? "no_subscriptions" : "send_failed";

      await service
        .from("delivery_push_jobs")
        .update({ status: "failed", last_error: reason })
        .eq("id", job.id);

      console.warn("[push] delivery failed", {
        jobId: job.id,
        deliveryId: job.delivery_id,
        reason,
        subscriptions: result.subscriptions,
        failed: result.failed,
        removed: result.removed,
      });
    }
  }

  if (summary.claimed > 0) console.info("[push] delivery drain", summary);

  return summary;
}

/** Montant mineur → libellé court, en FCFA pour les monnaies sans sous-unité. */
function priceLabel(amountMinor: number, currency: string): string {
  const decimals = currencyDecimals(currency);
  const value = amountMinor / 10 ** decimals;
  const text = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: decimals,
  }).format(value);

  return currency === "XOF" || currency === "XAF"
    ? `${text} FCFA`
    : `${text} ${currency}`;
}
