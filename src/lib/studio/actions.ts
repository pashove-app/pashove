"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Locale } from "@/i18n/config";
import {
  createSoftpay,
  listPayinRates,
  SasPayError,
} from "@/lib/payments/saspay/client";
import { currentStore } from "@/lib/stores/queries";
import { createClient } from "@/lib/supabase/server";

export type StudioActionResult = {
  status: "ok" | "error" | "unavailable";
  message: string;
};

const promptSchema = z.string().trim().min(1).max(2000);
const videoSchema = z.object({
  actionType: z.string().trim().min(1).max(64),
  prompt: z.string().trim().max(2000).default(""),
});
const rechargeSchema = z.coerce
  .number()
  .int()
  .min(500, "Le montant minimum est de 500 FCFA.")
  .max(500000, "Le montant maximum est de 500 000 FCFA.");

async function activePrice(actionType: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("studio_pricing")
    .select("action_type, price_fcfa")
    .eq("action_type", actionType)
    .eq("is_active", true)
    .maybeSingle();

  return data;
}

/**
 * Chat & textes.
 *
 * Le moteur DeepSeek sera branché à l'étape suivante. Tant qu'il ne l'est
 * pas, aucun crédit n'est débité : on préfère un message honnête à une
 * génération factice facturée.
 */
export async function sendStudioMessage(
  prompt: string,
): Promise<StudioActionResult> {
  const store = await currentStore();
  if (!store) {
    return { status: "error", message: "Boutique introuvable." };
  }

  const parsed = promptSchema.safeParse(prompt);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Écris un message entre 1 et 2 000 caractères.",
    };
  }

  const price = await activePrice("chat_message");
  if (!price) {
    return {
      status: "error",
      message: "Le Studio n'est pas encore activé pour cette boutique.",
    };
  }

  return {
    status: "unavailable",
    message: `Le moteur de génération sera connecté à l'étape suivante. Ton solde n'a pas été débité : un message coûtera ${price.price_fcfa} FCFA.`,
  };
}

/** Générateur vidéo. Le rendu TTS/Remotion arrive après l'intégration. */
export async function requestStudioVideo(input: {
  actionType: string;
  prompt: string;
}): Promise<StudioActionResult> {
  const store = await currentStore();
  if (!store) {
    return { status: "error", message: "Boutique introuvable." };
  }

  const parsed = videoSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Choisis un format de vidéo valide." };
  }

  if (!parsed.data.actionType.startsWith("video_")) {
    return { status: "error", message: "Choisis un format de vidéo valide." };
  }

  const price = await activePrice(parsed.data.actionType);
  if (!price) {
    return {
      status: "error",
      message: "Ce format de vidéo n'est plus disponible.",
    };
  }

  return {
    status: "unavailable",
    message: `Le générateur vidéo sera connecté à l'étape suivante. Aucun montant n'a été débité : cette vidéo coûtera ${price.price_fcfa} FCFA.`,
  };
}

export type StudioRechargeState = {
  status: "idle" | "pending" | "error";
  message?: string;
};

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Marchand", last: "Pashove" };
  return { first: parts[0], last: parts.slice(1).join(" ") || parts[0] };
}

/**
 * Recharge du portefeuille par softpay SasPay.
 *
 * Le montant est créé côté base (`create_studio_topup`), puis la référence
 * SasPay est enregistrée sur la recharge. Le crédit n'a lieu qu'à la
 * confirmation du webhook, de façon idempotente.
 */
export async function startStudioRechargeAction(
  _previous: StudioRechargeState,
  formData: FormData,
): Promise<StudioRechargeState> {
  const store = await currentStore();
  if (!store) {
    return { status: "error", message: "Boutique introuvable." };
  }

  if (store.currency.toUpperCase() !== "XOF") {
    return {
      status: "error",
      message:
        "Le Studio est facturé en FCFA : la recharge est disponible pour les boutiques en XOF. La conversion FX arrive ensuite.",
    };
  }

  const amount = Number(field(formData, "amount"));
  const network = field(formData, "network");
  const phone = field(formData, "phone");
  const locale = (field(formData, "locale") || "fr") as Locale;

  const parsed = rechargeSchema.safeParse(amount);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Montant invalide.",
    };
  }

  if (phone.replace(/\D/g, "").length < 8) {
    return { status: "error", message: "Numéro de téléphone invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Session expirée, reconnecte-toi." };
  }

  const rates = await listPayinRates().catch(() => []);
  const rate = rates.find(
    (entry) =>
      entry.network_code === network &&
      entry.country_code?.toUpperCase() === store.country.toUpperCase() &&
      entry.payin?.available !== false,
  );

  if (!rate) {
    return { status: "error", message: "Moyen de paiement indisponible." };
  }

  const { data: created, error: createError } = await supabase.rpc(
    "create_studio_topup",
    { p_store_id: store.id, p_amount: amount },
  );

  if (createError) {
    if (createError.message.includes("studio_topup_pending")) {
      return {
        status: "error",
        message:
          "Une recharge est déjà en attente de confirmation. Termine-la ou attends son expiration avant d'en lancer une autre.",
      };
    }
    if (createError.message.includes("studio_currency_unsupported")) {
      return {
        status: "error",
        message: "La recharge Studio est disponible pour les boutiques en XOF.",
      };
    }
    console.error("[studio] create topup failed", createError.message);
    return { status: "error", message: "Recharge impossible pour le moment." };
  }

  const topup = created as {
    id?: string;
    amount?: number;
    currency?: string;
  } | null;

  if (!topup?.id || !topup.amount || !topup.currency) {
    return { status: "error", message: "Recharge impossible pour le moment." };
  }

  const name = splitName(
    (user.user_metadata?.full_name as string | undefined) ?? store.name,
  );

  let intent;
  try {
    intent = await createSoftpay({
      amount: topup.amount,
      currency: topup.currency,
      country: store.country,
      network,
      description: `Recharge Studio · ${store.name}`,
      customer: {
        email: user.email ?? store.contact_email ?? "marchand@pashove.com",
        first_name: name.first,
        last_name: name.last,
        phone,
      },
      metadata: { studio_topup_id: topup.id },
      returnUrl: `${siteUrl()}/${locale}/app/studio`,
      feeChargeMode: "ADD_ON",
      idempotencyKey: topup.id,
    });
  } catch (error) {
    if (error instanceof SasPayError) {
      console.error("[studio] softpay failed", error.code, error.message);
    }
    return { status: "error", message: "SasPay a refusé le paiement." };
  }

  const { error: intentError } = await supabase.rpc(
    "record_studio_topup_intent",
    {
      p_id: topup.id,
      p_reference: intent.id,
      p_network: network,
      p_redirect_url: intent.checkout_url?.trim() || null,
      p_country: store.country,
    },
  );

  if (intentError) {
    console.error("[studio] record topup intent failed", intentError.message);
  }

  revalidatePath(`/${locale}/app/studio`);

  if (intent.checkout_url?.trim()) {
    redirect(intent.checkout_url);
  }

  return {
    status: "pending",
    message:
      "Confirme la demande reçue sur ton téléphone. Ton solde sera crédité dès la confirmation.",
  };
}
