"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentStore } from "@/lib/stores/queries";
import {
  createSoftpay,
  listPayinRates,
  SasPayError,
} from "@/lib/payments/saspay/client";
import type { Locale } from "@/i18n/config";

export type PlanPaymentState = {
  status: "idle" | "pending" | "error";
  message?: string;
};

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Marchand", last: "Pashove" };
  return { first: parts[0], last: parts.slice(1).join(" ") || parts[0] };
}

/** Lance le paiement d'un abonnement Standard/Pro par softpay SasPay. */
export async function startPlanPaymentAction(
  _previous: PlanPaymentState,
  formData: FormData,
): Promise<PlanPaymentState> {
  const store = await currentStore();
  if (!store) return { status: "error", message: "Boutique introuvable." };

  const planCode = field(formData, "planCode");
  const network = field(formData, "network");
  const phone = field(formData, "phone");
  const locale = (field(formData, "locale") || "fr") as Locale;

  if (planCode !== "standard" && planCode !== "pro") {
    return { status: "error", message: "Choisis un plan." };
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

  // Le réseau doit réellement exister chez SasPay pour le pays de la boutique.
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
    "create_plan_payment",
    { p_plan_code: planCode },
  );

  if (createError) {
    if (createError.message.includes("plan_payment_pending")) {
      return {
        status: "error",
        message:
          "Un paiement d’abonnement est déjà en attente de confirmation. Termine-le avant d’en lancer un autre.",
      };
    }
    return { status: "error", message: "Paiement d’abonnement impossible." };
  }

  if (!created) {
    return { status: "error", message: "Paiement d’abonnement impossible." };
  }

  const payment = created as {
    id?: string;
    amount?: number;
    currency?: string;
  };

  if (!payment.id || !payment.amount || !payment.currency) {
    return { status: "error", message: "Paiement d’abonnement impossible." };
  }

  if (payment.currency.toUpperCase() !== store.currency.toUpperCase()) {
    return {
      status: "error",
      message:
        "Le prix du plan est en XOF : la boutique doit être en XOF pour payer l’abonnement. La conversion FX des abonnements arrive ensuite.",
    };
  }

  const name = splitName(
    (user.user_metadata?.full_name as string | undefined) ?? store.name,
  );

  let intent;
  try {
    intent = await createSoftpay({
      amount: payment.amount,
      currency: payment.currency,
      country: store.country,
      network,
      description: `Abonnement ${planCode} · ${store.name}`,
      customer: {
        email: user.email ?? store.contact_email ?? "marchand@pashove.com",
        first_name: name.first,
        last_name: name.last,
        phone,
      },
      metadata: { plan_payment_id: payment.id },
      returnUrl: `${siteUrl()}/${locale}/app/settings/plan`,
      feeChargeMode: "ADD_ON",
      idempotencyKey: payment.id,
    });
  } catch (error) {
    if (error instanceof SasPayError) {
      console.error("[plans] softpay failed", error.code, error.message);
    }
    return { status: "error", message: "SasPay a refusé le paiement." };
  }

  await supabase.rpc("record_plan_payment_intent", {
    p_id: payment.id,
    p_reference: intent.id,
    p_network: network,
    p_redirect_url: intent.checkout_url?.trim() || null,
    p_country: store.country,
  });

  revalidatePath("/", "layout");

  if (intent.checkout_url?.trim()) {
    redirect(intent.checkout_url);
  }

  return {
    status: "pending",
    message:
      "Confirme la demande reçue sur ton téléphone. Ton plan s’active dès la confirmation.",
  };
}
