"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { afterDeliveryPush } from "@/lib/pwa/after-push";
import { broadcastDeliveryLocation } from "@/lib/delivery/broadcast";
import { geocodeAddress } from "@/lib/geo/geocode";
import { deliverEmail } from "@/lib/email/transport";
import { resolveLocale } from "@/i18n/config";
import { z } from "zod";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

const locationSchema = z.object({
  deliveryId: z.uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(100000).nullable().optional(),
  heading: z.number().min(0).max(360).nullable().optional(),
  speed: z.number().min(0).max(1000).nullable().optional(),
});

export type CourierTrackingResult = {
  ok: boolean;
  error?: string;
};

/**
 * Démarre la course : la position courante du livreur devient le point de
 * ramassage. La destination est géocodée une seule fois, puis diffusée.
 */
export async function startDeliveryAction(
  input: unknown,
): Promise<CourierTrackingResult> {
  const parsed = locationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_location" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_delivery", {
    p_delivery_id: parsed.data.deliveryId,
    p_latitude: parsed.data.latitude,
    p_longitude: parsed.data.longitude,
  });

  if (error) {
    console.error("[tracking] start failed", error.message);
    return { ok: false, error: error.message };
  }

  const started = data as {
    orderToken?: string;
    address?: string | null;
    extra?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;

  if (started?.orderToken) {
    // La position part tout de suite : le client n'attend pas le géocodage.
    const updatedAt = new Date().toISOString();
    await broadcastDeliveryLocation(started.orderToken, {
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      accuracy: parsed.data.accuracy ?? null,
      heading: parsed.data.heading ?? null,
      speed: parsed.data.speed ?? null,
      updatedAt,
    });

    const destination = await geocodeAddress({
      address: started.address,
      extra: started.extra,
      city: started.city,
      country: started.country,
    });

    if (destination) {
      await supabase.rpc("set_delivery_destination", {
        p_delivery_id: parsed.data.deliveryId,
        p_latitude: destination.latitude,
        p_longitude: destination.longitude,
      });
    }
  }

  return { ok: true };
}

/** Position GPS suivante. Ne rafraîchit pas la page : le suivi est continu. */
export async function updateCourierLocationAction(
  input: unknown,
): Promise<CourierTrackingResult> {
  const parsed = locationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_location" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_delivery_location", {
    p_delivery_id: parsed.data.deliveryId,
    p_latitude: parsed.data.latitude,
    p_longitude: parsed.data.longitude,
    p_accuracy: parsed.data.accuracy ?? null,
    p_heading: parsed.data.heading ?? null,
    p_speed: parsed.data.speed ?? null,
  });

  if (error) {
    console.error("[tracking] location update failed", error.message);
    return { ok: false, error: error.message };
  }

  const result = data as { orderToken?: string; updatedAt?: string } | null;

  if (result?.orderToken) {
    await broadcastDeliveryLocation(result.orderToken, {
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      accuracy: parsed.data.accuracy ?? null,
      heading: parsed.data.heading ?? null,
      speed: parsed.data.speed ?? null,
      updatedAt: result.updatedAt ?? new Date().toISOString(),
    });
  }

  return { ok: true };
}

export async function setCourierOnlineAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(field(formData, "locale") || "fr");
  const online = field(formData, "online") === "true";

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_courier_online", {
    p_online: online,
  });

  if (error) {
    console.error("[courier] online toggle failed", error.message);
  } else {
    // Le passage en ligne peut dispatcher une course en attente.
    afterDeliveryPush();
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/courier`);
}

export async function acceptDeliveryAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(field(formData, "locale") || "fr");
  const id = field(formData, "deliveryId");
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_delivery", {
    p_delivery_id: id,
  });

  if (error) {
    redirect(`/${locale}/app/courier?error=${encodeURIComponent(error.message)}`);
  }

  // Le code part au client, jamais au livreur. Le service_role génère le
  // code et l'e-mail est expédié ici, côté serveur.
  const service = createServiceClient();
  if (service) {
    const { data } = await service.rpc("issue_delivery_otp", {
      p_delivery_id: id,
    });
    const otp = data as
      | { code?: string; email?: string; customerName?: string; orderNumber?: number; storeName?: string }
      | null;

    if (otp?.code && otp.email) {
      const result = await deliverEmail({
        template: "delivery_otp",
        to: otp.email,
        toName: otp.customerName ?? null,
        subject: `Ton code de livraison · ${otp.storeName ?? "Pashove"}`,
        html: `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0A0E1A">
  <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#2F5CFF;font-weight:600">Pashove Delivery</p>
  <h1 style="font-size:24px;margin:16px 0 8px">Ton code de livraison</h1>
  <p style="font-size:15px;line-height:1.6;color:#5B6475">Commande #${otp.orderNumber ?? ""} · ${otp.storeName ?? "Pashove"}</p>
  <p style="font-size:34px;letter-spacing:10px;font-weight:700;margin:24px 0;padding:18px;text-align:center;background:#F4F6FB;border-radius:16px">${otp.code}</p>
  <p style="font-size:14px;line-height:1.6;color:#5B6475">Donne ce code au livreur uniquement à la réception du colis. Il expire dans 24 heures.</p>
</div>`,
        text: `Ton code de livraison : ${otp.code}
Commande #${otp.orderNumber ?? ""} · ${otp.storeName ?? "Pashove"}
Donne-le au livreur uniquement à la réception. Valable 24 heures.`,
      });

      if (!result.ok) {
        console.error("[courier] OTP email failed", result.error);
      }
    }
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/courier`);
}

export async function declineDeliveryAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(field(formData, "locale") || "fr");
  const id = field(formData, "deliveryId");
  const supabase = await createClient();
  const { error } = await supabase.rpc("decline_delivery", {
    p_delivery_id: id,
  });

  // Un refus passe la course au livreur suivant : sa notification part tout de
  // suite, sans attendre le cron.
  if (!error) afterDeliveryPush();

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/courier`);
}

export async function deliverDeliveryAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(field(formData, "locale") || "fr");
  const id = field(formData, "deliveryId");
  const otp = field(formData, "otp").replace(/\D/g, "");

  if (!/^\d{4}$/.test(otp)) {
    redirect(`/${locale}/app/courier?error=invalidOtp`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("deliver_delivery", {
    p_delivery_id: id,
    p_otp: otp,
  });

  if (error) {
    const code = error.message.includes("otp_locked")
      ? "otpLocked"
      : error.message.includes("otp_expired")
        ? "otpExpired"
        : "invalidOtp";
    redirect(`/${locale}/app/courier?error=${code}`);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/courier?delivered=1`);
}

export async function reportDeliveryProblemAction(
  formData: FormData,
): Promise<void> {
  const locale = resolveLocale(field(formData, "locale") || "fr");
  const id = field(formData, "deliveryId");
  const reason = field(formData, "reason");

  const supabase = await createClient();
  const { error } = await supabase.rpc("report_delivery_problem", {
    p_delivery_id: id,
    p_reason: reason || "Problème signalé par le livreur",
  });

  if (error) {
    redirect(`/${locale}/app/courier?error=problemFailed`);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/courier?disputed=1`);
}

/** Appelée par le compte à rebours quand il atteint zéro. */
export async function expireDeliveryOfferAction(
  deliveryId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("expire_delivery_offer", { p_delivery_id: deliveryId });
  revalidatePath("/", "layout");
}
