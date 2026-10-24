"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  encryptPayoutNumber,
  fingerprintPayoutNumber,
  isPayoutEncryptionConfigured,
  lastFour,
  normalizePayoutNumber,
} from "@/lib/finance/crypto";
import {
  getPayout,
  getPayoutMethod,
  listPayoutMethods,
} from "@/lib/finance/queries";
import {
  payoutMethodSchema,
  payoutPinSchema,
} from "@/lib/finance/payout-schema";
import type {
  PayoutFormState,
  PayoutMethodFormState,
  PayoutPinFormState,
} from "@/lib/finance/types";
import { parsePrice } from "@/lib/products/schema";
import { currentStore } from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { toFieldErrors } from "@/lib/validation";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function methodErrorKey(error: { code?: string; message?: string }): string {
  const message = error.message ?? "";

  if (error.code === "23505") return "methodDuplicate";
  if (message.includes("method_not_found")) return "methodNotFound";
  if (message.includes("not_owner")) return "serverError";

  return "serverError";
}

/** Crée ou met à jour une méthode de retrait, numéro chiffré. */
export async function savePayoutMethodAction(
  _previous: PayoutMethodFormState,
  formData: FormData,
): Promise<PayoutMethodFormState> {
  const locale = field(formData, "locale") || "fr";
  const methodId = field(formData, "methodId");

  const parsed = payoutMethodSchema(!methodId).safeParse({
    country: field(formData, "country"),
    provider: field(formData, "provider"),
    accountName: field(formData, "accountName"),
    accountNumber: field(formData, "accountNumber"),
    isDefault: field(formData, "isDefault") === "on",
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };
  if (!isPayoutEncryptionConfigured()) {
    return { status: "error", messageKey: "encryptionNotConfigured" };
  }

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) return { status: "error", messageKey: "sessionExpired" };

  const existing = methodId
    ? await getPayoutMethod(methodId, store.id)
    : null;

  if (methodId && !existing) {
    return { status: "error", messageKey: "methodNotFound" };
  }

  const digits = normalizePayoutNumber(parsed.data.accountNumber);

  const payload = {
    country: parsed.data.country,
    provider: parsed.data.provider,
    account_name: parsed.data.accountName,
  };

  let savedId = methodId;

  if (!methodId) {
    const { data, error } = await supabase
      .from("payout_methods")
      .insert({
        ...payload,
        store_id: store.id,
        account_number_encrypted: encryptPayoutNumber(digits),
        account_fingerprint: fingerprintPayoutNumber(digits),
        account_last4: lastFour(digits),
        is_default: false,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { status: "error", messageKey: methodErrorKey(error ?? {}) };
    }

    savedId = data.id as string;
  } else {
    const unsetDefault =
      existing?.is_default === true && !parsed.data.isDefault;

    const { error } = await supabase
      .from("payout_methods")
      .update({
        ...payload,
        ...(digits.length > 0
          ? {
              account_number_encrypted: encryptPayoutNumber(digits),
              account_fingerprint: fingerprintPayoutNumber(digits),
              account_last4: lastFour(digits),
            }
          : {}),
        ...(unsetDefault ? { is_default: false } : {}),
      })
      .eq("id", methodId)
      .eq("store_id", store.id)
      .is("archived_at", null);

    if (error) {
      return { status: "error", messageKey: methodErrorKey(error) };
    }
  }

  const methods = await listPayoutMethods(store.id);
  const hasDefault = methods.some((method) => method.is_default);

  if (parsed.data.isDefault || (!methodId && !hasDefault && savedId)) {
    await supabase.rpc("set_default_payout_method", {
      p_store_id: store.id,
      p_method_id: savedId,
    });
  }

  revalidatePath("/", "layout");
  redirect(
    `/${locale}/app/finance/methods?${methodId ? "updated=1" : "created=1"}`,
  );
}

/** Archive une méthode : l'historique des retraits la garde. */
export async function archivePayoutMethodAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  const methodId = field(formData, "methodId");

  if (!isSupabaseConfigured() || !methodId) return;

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) redirect(`/${locale}/auth/login`);

  const existing = await getPayoutMethod(methodId, store.id);
  if (!existing) return;

  const { error } = await supabase
    .from("payout_methods")
    .update({ archived_at: new Date().toISOString(), is_default: false })
    .eq("id", methodId)
    .eq("store_id", store.id);

  if (error) return;

  if (existing.is_default) {
    const remaining = await listPayoutMethods(store.id);
    if (remaining[0]) {
      await supabase.rpc("set_default_payout_method", {
        p_store_id: store.id,
        p_method_id: remaining[0].id,
      });
    }
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/finance/methods?deleted=1`);
}

/** Définit la méthode proposée par défaut lors d'un retrait. */
export async function setDefaultPayoutMethodAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  const methodId = field(formData, "methodId");

  if (!isSupabaseConfigured() || !methodId) return;

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) redirect(`/${locale}/auth/login`);

  const existing = await getPayoutMethod(methodId, store.id);
  if (!existing) return;

  await supabase.rpc("set_default_payout_method", {
    p_store_id: store.id,
    p_method_id: methodId,
  });

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/finance/methods?default=1`);
}

function pinErrorKey(error: { message?: string }): string {
  const message = error.message ?? "";

  if (message.includes("pin_too_weak")) return "pinTooWeak";
  if (message.includes("pin_invalid_format")) return "pinInvalidFormat";
  if (message.includes("not_owner")) return "serverError";

  return "serverError";
}

/**
 * Configure ou change le PIN de retrait.
 *
 * Le mot de passe actuel est revérifié : une session laissée ouverte ne suffit
 * pas à poser le secret qui autorise les sorties d'argent. Le PIN n'est jamais
 * haché côté client ni renvoyé au navigateur.
 */
export async function setPayoutPinAction(
  _previous: PayoutPinFormState,
  formData: FormData,
): Promise<PayoutPinFormState> {
  const parsed = payoutPinSchema.safeParse({
    currentPassword: field(formData, "currentPassword"),
    pin: field(formData, "pin"),
    confirm: field(formData, "confirm"),
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) return { status: "error", messageKey: "sessionExpired" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { status: "error", messageKey: "sessionExpired" };

  const { error: wrongPassword } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (wrongPassword) {
    return {
      status: "invalid",
      fieldErrors: { currentPassword: "currentPasswordWrong" },
    };
  }

  const { error } = await supabase.rpc("set_payout_pin", {
    p_store_id: store.id,
    p_pin: parsed.data.pin,
  });

  if (error) {
    return { status: "error", messageKey: pinErrorKey(error) };
  }

  revalidatePath("/", "layout");
  return { status: "saved", messageKey: "pinSaved" };
}

/* ------------------------------------------------------------------ *
 *  Demandes de retrait
 * ------------------------------------------------------------------ */

function payoutErrorKey(error: { message?: string }): string {
  const message = error.message ?? "";

  if (message.includes("insufficient_funds")) return "insufficientFunds";
  if (message.includes("payout_amount_too_low")) return "payoutAmountTooLow";
  if (message.includes("method_not_found")) return "payoutMethodMissing";
  if (message.includes("pin_locked")) return "pinLocked";
  if (message.includes("pin_not_set")) return "pinNotSet";
  if (message.includes("invalid_idempotency_key")) return "serverError";
  if (message.includes("not_owner")) return "serverError";

  return "serverError";
}

/** Réserve le montant et crée une demande de retrait, après vérification du PIN. */
export async function requestPayoutAction(
  _previous: PayoutFormState,
  formData: FormData,
): Promise<PayoutFormState> {
  const locale = field(formData, "locale") || "fr";
  const methodId = field(formData, "methodId");
  const pin = field(formData, "pin");
  const idempotencyKey = field(formData, "idempotencyKey");

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) return { status: "error", messageKey: "sessionExpired" };

  const amount = parsePrice(field(formData, "amount"), store.currency);

  if (amount === null || amount <= 0) {
    return {
      status: "invalid",
      fieldErrors: { amount: "payoutAmountInvalid" },
    };
  }

  if (amount < 1000) {
    return {
      status: "invalid",
      fieldErrors: { amount: "payoutAmountTooLow" },
    };
  }

  if (!/^[0-9]{4}$/.test(pin)) {
    return { status: "invalid", fieldErrors: { pin: "pinInvalidFormat" } };
  }

  if (!methodId) {
    return {
      status: "invalid",
      fieldErrors: { methodId: "payoutMethodMissing" },
    };
  }

  const { data, error } = await supabase.rpc("request_payout", {
    p_store_id: store.id,
    p_method_id: methodId,
    p_amount: amount,
    p_pin: pin,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    return { status: "error", messageKey: payoutErrorKey(error) };
  }

  const result = data as { status?: string } | null;

  if (result?.status === "pin_invalid") {
    return { status: "invalid", fieldErrors: { pin: "pinInvalid" } };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/finance/payouts?created=1`);
}

/** Annule une demande encore en attente et libère les fonds réservés. */
export async function cancelPayoutAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  const payoutId = field(formData, "payoutId");

  if (!isSupabaseConfigured() || !payoutId) return;

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) redirect(`/${locale}/auth/login`);

  const existing = await getPayout(payoutId, store.id);
  if (!existing) return;

  const { error } = await supabase.rpc("cancel_payout", {
    p_payout_id: payoutId,
  });

  if (error) return;

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/finance/payouts?cancelled=1`);
}
