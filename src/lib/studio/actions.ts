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
import {
  deepSeekChat,
  deepSeekCostFcfa,
  DeepSeekError,
  isDeepSeekConfigured,
  usdToXofRate,
  type DeepSeekMessage,
} from "@/lib/studio/deepseek";
import { currentStore } from "@/lib/stores/queries";
import { createClient } from "@/lib/supabase/server";

export type StudioActionResult = {
  status: "ok" | "error" | "unavailable";
  message: string;
  /** Script ou texte produit par le modèle. */
  resultText?: string;
  /** Nouveau solde après débit, pour l'affichage immédiat. */
  balanceFcfa?: number;
};

const promptSchema = z.string().trim().min(1).max(2000);
const historySchema = z
  .array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().trim().min(1).max(4000),
    }),
  )
  .max(20)
  .default([]);
const videoSchema = z.object({
  actionType: z.string().trim().min(1).max(64),
  prompt: z.string().trim().max(2000).default(""),
});
const rechargeSchema = z.coerce
  .number()
  .int()
  .min(500, "Le montant minimum est de 500 FCFA.")
  .max(500000, "Le montant maximum est de 500 000 FCFA.");

const VIDEO_BRIEFS: Record<string, { duration: number; style: string }> = {
  video_15s_simple: {
    duration: 15,
    style: "court, texte animé, sans voix off",
  },
  video_30s_standard: {
    duration: 30,
    style: "standard, avec voix off",
  },
  video_60s_premium: {
    duration: 60,
    style: "premium, voix off et musique",
  },
  video_110s_ultra: {
    duration: 110,
    style: "ultra, motion design complet",
  },
};

function chatSystemPrompt(store: {
  name: string;
  country: string;
  product_types: string[];
}): string {
  return [
    "Tu es l’assistant de Pashove Studio, pour un marchand d’Afrique de l’Ouest.",
    "Tu l’aides à écrire des textes pour sa boutique en ligne : descriptions de produits, messages clients, publications, idées.",
    `Boutique : ${store.name} (${store.country}). Types de produits : ${store.product_types.join(", ") || "non précisés"}.`,
    "Réponds en français, de façon concrète, professionnelle et concise.",
    "N’invente pas de caractéristiques produit qui ne figurent pas dans la demande ; pose une question si une information essentielle manque.",
    "Ne mentionne pas que tu es un modèle de langage.",
  ].join("\n");
}

function videoSystemPrompt(
  store: { name: string; country: string; product_types: string[] },
  brief: { duration: number; style: string },
): string {
  return [
    "Tu écris des scripts de vidéos publicitaires pour des boutiques d’Afrique de l’Ouest.",
    `Boutique : ${store.name} (${store.country}). Types de produits : ${store.product_types.join(", ") || "non précisés"}.`,
    `Durée demandée : ${brief.duration} secondes. Style : ${brief.style}.`,
    "Structure : accroche (0-3 s), deux ou trois plans avec le texte à l’écran, voix off, appel à l’action.",
    "Réponds uniquement avec le script, en français, sans introduction ni commentaire.",
  ].join("\n");
}

function keepRecentHistory(
  history: { role: "user" | "assistant"; content: string }[],
  maxCharacters: number,
): { role: "user" | "assistant"; content: string }[] {
  const recent = history.slice(-12);
  let total = recent.reduce((sum, message) => sum + message.content.length, 0);

  while (recent.length > 0 && total > maxCharacters) {
    const removed = recent.shift();
    total -= removed?.content.length ?? 0;
  }

  return recent;
}

function deepSeekErrorMessage(error: DeepSeekError): string {
  if (error.code === "timeout") {
    return "L’assistant a mis trop de temps à répondre. Réessaie dans un instant.";
  }
  if (error.code === "not_configured") {
    return "L’assistant IA n’est pas encore configuré sur cette installation.";
  }
  return "L’assistant est momentanément indisponible. Réessaie dans un instant.";
}

async function studioPricing(storeId: string, actionType: string) {
  const supabase = await createClient();
  const [pricingResult, balanceResult] = await Promise.all([
    supabase
      .from("studio_pricing")
      .select("price_fcfa")
      .eq("action_type", actionType)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("store_studio_balance")
      .select("balance_fcfa")
      .eq("store_id", storeId)
      .maybeSingle(),
  ]);

  return {
    supabase,
    price: pricingResult.data?.price_fcfa ?? null,
    balance: balanceResult.data?.balance_fcfa ?? 0,
  };
}

/* ------------------------------------------------------------------ *
 *  Chat & textes
 * ------------------------------------------------------------------ */

export async function sendStudioMessage(
  prompt: string,
  historyInput: { role: "user" | "assistant"; content: string }[] = [],
): Promise<StudioActionResult> {
  const store = await currentStore();
  if (!store) {
    return { status: "error", message: "Boutique introuvable." };
  }

  const parsedPrompt = promptSchema.safeParse(prompt);
  if (!parsedPrompt.success) {
    return {
      status: "error",
      message: "Écris un message entre 1 et 2 000 caractères.",
    };
  }

  const parsedHistory = historySchema.safeParse(historyInput);
  if (!parsedHistory.success) {
    return { status: "error", message: "La conversation est invalide." };
  }

  if (!isDeepSeekConfigured()) {
    return {
      status: "error",
      message:
        "L’assistant IA n’est pas encore configuré. La clé DEEPSEEK_API_KEY manque côté serveur.",
    };
  }

  const { supabase, price, balance } = await studioPricing(
    store.id,
    "chat_message",
  );

  if (price == null) {
    return {
      status: "error",
      message: "Le Studio n’est pas encore activé pour cette boutique.",
    };
  }

  if (balance < price) {
    return {
      status: "error",
      message: `Solde insuffisant : un message coûte ${price} FCFA. Recharge ton Studio.`,
    };
  }

  const history = keepRecentHistory(parsedHistory.data, 10000);
  const messages: DeepSeekMessage[] = [
    { role: "system", content: chatSystemPrompt(store) },
    ...history,
    { role: "user", content: parsedPrompt.data },
  ];

  let completion;
  try {
    completion = await deepSeekChat(messages, { maxTokens: 900 });
  } catch (error) {
    if (error instanceof DeepSeekError) {
      console.error("[studio] deepseek chat failed", error.code, error.message);
      return { status: "error", message: deepSeekErrorMessage(error) };
    }
    console.error("[studio] deepseek chat failed", error);
    return { status: "error", message: "L’assistant est momentanément indisponible." };
  }

  const rate = await usdToXofRate();
  const costReal = deepSeekCostFcfa(completion.usage, rate);

  const { data: charged, error: chargeError } = await supabase.rpc(
    "charge_studio_generation",
    {
      p_store_id: store.id,
      p_action_type: "chat_message",
      p_prompt: parsedPrompt.data,
      p_result_text: completion.content,
      p_status: "completed",
      p_cost_real_fcfa: costReal,
      p_metadata: {
        model: completion.model,
        prompt_tokens: completion.usage.promptTokens,
        completion_tokens: completion.usage.completionTokens,
        prompt_cache_miss_tokens: completion.usage.promptCacheMissTokens,
        prompt_cache_hit_tokens: completion.usage.promptCacheHitTokens,
        usd_xof: rate,
      },
    },
  );

  if (chargeError) {
    console.error("[studio] charge failed", chargeError.message);
    if (chargeError.message.includes("studio_insufficient_balance")) {
      return {
        status: "error",
        message: `Solde insuffisant : un message coûte ${price} FCFA. Recharge ton Studio.`,
      };
    }
    return {
      status: "error",
      message: "La génération n’a pas pu être facturée. Réessaie.",
    };
  }

  const charge = charged as { balance?: number } | null;

  revalidatePath("/", "layout");

  return {
    status: "ok",
    message: completion.content,
    resultText: completion.content,
    balanceFcfa: charge?.balance,
  };
}

/* ------------------------------------------------------------------ *
 *  Générateur vidéo — script
 * ------------------------------------------------------------------ */

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

  const brief = VIDEO_BRIEFS[parsed.data.actionType];
  if (!brief) {
    return { status: "error", message: "Choisis un format de vidéo valide." };
  }

  if (!isDeepSeekConfigured()) {
    return {
      status: "error",
      message:
        "L’assistant IA n’est pas encore configuré. La clé DEEPSEEK_API_KEY manque côté serveur.",
    };
  }

  const { supabase, price, balance } = await studioPricing(
    store.id,
    parsed.data.actionType,
  );

  if (price == null) {
    return {
      status: "error",
      message: "Ce format de vidéo n’est plus disponible.",
    };
  }

  if (balance < price) {
    return {
      status: "error",
      message: `Solde insuffisant : cette vidéo coûte ${price} FCFA. Recharge ton Studio.`,
    };
  }

  let completion;
  try {
    completion = await deepSeekChat(
      [
        { role: "system", content: videoSystemPrompt(store, brief) },
        {
          role: "user",
          content:
            parsed.data.prompt ||
            "Présente la boutique et ses produits avec un ton chaleureux.",
        },
      ],
      { maxTokens: 1100, temperature: 0.8 },
    );
  } catch (error) {
    if (error instanceof DeepSeekError) {
      console.error("[studio] deepseek video failed", error.code, error.message);
      return { status: "error", message: deepSeekErrorMessage(error) };
    }
    console.error("[studio] deepseek video failed", error);
    return { status: "error", message: "L’assistant est momentanément indisponible." };
  }

  const rate = await usdToXofRate();
  const costReal = deepSeekCostFcfa(completion.usage, rate);

  const { data: charged, error: chargeError } = await supabase.rpc(
    "charge_studio_generation",
    {
      p_store_id: store.id,
      p_action_type: parsed.data.actionType,
      p_prompt: parsed.data.prompt,
      p_result_text: completion.content,
      p_status: "processing",
      p_cost_real_fcfa: costReal,
      p_metadata: {
        model: completion.model,
        prompt_tokens: completion.usage.promptTokens,
        completion_tokens: completion.usage.completionTokens,
        prompt_cache_miss_tokens: completion.usage.promptCacheMissTokens,
        prompt_cache_hit_tokens: completion.usage.promptCacheHitTokens,
        usd_xof: rate,
        duration_seconds: brief.duration,
      },
    },
  );

  if (chargeError) {
    console.error("[studio] video charge failed", chargeError.message);
    if (chargeError.message.includes("studio_insufficient_balance")) {
      return {
        status: "error",
        message: `Solde insuffisant : cette vidéo coûte ${price} FCFA. Recharge ton Studio.`,
      };
    }
    return {
      status: "error",
      message: "La génération n’a pas pu être facturée. Réessaie.",
    };
  }

  const charge = charged as { balance?: number } | null;

  revalidatePath("/", "layout");

  return {
    status: "ok",
    message:
      "Script généré. Le rendu vidéo sera ajouté à la prochaine étape.",
    resultText: completion.content,
    balanceFcfa: charge?.balance,
  };
}

/* ------------------------------------------------------------------ *
 *  Recharge SasPay
 * ------------------------------------------------------------------ */

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

/** Message marchand à partir du refus SasPay, sans exposer de détail interne. */
function saspayUserMessage(error: SasPayError): string {
  const text = `${error.code} ${error.message}`.toLowerCase();

  if (/idempot|duplicate|conflict|409/.test(text)) {
    return "Une recharge précédente est encore en cours. Attends quelques minutes puis réessaie.";
  }
  if (/phone|msisdn|num[eé]ro|invalid/.test(text)) {
    return "Le numéro Mobile Money est invalide ou n’est pas reconnu par l’opérateur.";
  }
  if (/insufficient|balance|solde|funds/.test(text)) {
    return "Solde insuffisant sur ce compte Mobile Money.";
  }
  if (/unavailable|network|operator|op[eé]rateur|down/.test(text)) {
    return "Ce réseau Mobile Money est momentanément indisponible. Essaie un autre opérateur.";
  }

  const detail = error.message.trim();
  return detail
    ? `SasPay a refusé le paiement : ${detail.slice(0, 180)}`
    : "SasPay a refusé le paiement. Essaie un autre opérateur.";
}

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
    await supabase.rpc("fail_studio_topup_by_id", { p_id: topup.id });

    if (error instanceof SasPayError) {
      console.error(
        "[studio] softpay failed",
        error.code,
        error.status,
        error.message,
      );
      return { status: "error", message: saspayUserMessage(error) };
    }

    return {
      status: "error",
      message: "Impossible de joindre SasPay. Vérifie ta connexion et réessaie.",
    };
  }

  const providerStatus = String(
    (intent as { status?: string }).status ?? "",
  ).toUpperCase();

  if (["FAILED", "CANCELLED", "REJECTED"].includes(providerStatus)) {
    await supabase.rpc("fail_studio_topup_by_id", { p_id: topup.id });
    return {
      status: "error",
      message:
        "SasPay a refusé le paiement. Vérifie le numéro et le solde du compte Mobile Money, ou essaie un autre opérateur.",
    };
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
