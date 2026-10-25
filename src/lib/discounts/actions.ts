"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { discountSchema, parseDate } from "@/lib/discounts/schema";
import type { DiscountFormState } from "@/lib/discounts/types";
import { parsePrice } from "@/lib/products/schema";
import { currentStore } from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { toFieldErrors } from "@/lib/validation";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function messageKeyFor(error: { code?: string; message?: string }): string {
  const message = error.message ?? "";

  if (error.code === "23505" || message.includes("duplicate key")) {
    return "codeTaken";
  }
  if (message.includes("discount_codes_code_check")) return "codeInvalid";
  if (message.includes("discount_codes_value_check")) return "valueInvalid";
  if (message.includes("discount_codes_check")) return "datesInvalid";

  return "serverError";
}

/** Crée un code promo. Le `store_id` vient toujours du serveur. */
export async function createDiscountAction(
  _previous: DiscountFormState,
  formData: FormData,
): Promise<DiscountFormState> {
  const locale = field(formData, "locale") || "fr";

  const parsed = discountSchema.safeParse({
    code: field(formData, "code"),
    kind: field(formData, "kind"),
    value: field(formData, "value"),
    minSubtotal: field(formData, "minSubtotal"),
    maxUses: field(formData, "maxUses"),
    startsAt: field(formData, "startsAt"),
    expiresAt: field(formData, "expiresAt"),
    active: field(formData, "active"),
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) return { status: "error", messageKey: "sessionExpired" };

  const fieldErrors: Record<string, string> = {};
  let value: number | null;

  if (parsed.data.kind === "percent") {
    value = /^\d{1,3}$/.test(parsed.data.value.replace(/\s/g, ""))
      ? Number(parsed.data.value.replace(/\s/g, ""))
      : null;
    if (value === null || value < 1 || value > 100) {
      fieldErrors.value = "valueInvalid";
    }
  } else {
    value = parsePrice(parsed.data.value, store.currency);
    if (value === null || value <= 0) {
      fieldErrors.value = "valueInvalid";
    }
  }

  const minSubtotal = parsed.data.minSubtotal
    ? parsePrice(parsed.data.minSubtotal, store.currency)
    : 0;
  if (minSubtotal === null || minSubtotal < 0) {
    fieldErrors.minSubtotal = "minInvalid";
  }

  let maxUses: number | null = null;
  if (parsed.data.maxUses) {
    const raw = parsed.data.maxUses.replace(/\s/g, "");
    maxUses = /^\d{1,6}$/.test(raw) ? Number(raw) : null;
    if (maxUses === null || maxUses <= 0) {
      fieldErrors.maxUses = "maxUsesInvalid";
    }
  }

  const starts = parseDate(parsed.data.startsAt, false);
  const expires = parseDate(parsed.data.expiresAt, true);

  if (starts.invalid) fieldErrors.startsAt = "dateInvalid";
  if (expires.invalid) fieldErrors.expiresAt = "dateInvalid";
  if (
    starts.value &&
    expires.value &&
    new Date(expires.value) <= new Date(starts.value)
  ) {
    fieldErrors.expiresAt = "datesInvalid";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "invalid", fieldErrors };
  }

  const { error } = await supabase.from("discount_codes").insert({
    store_id: store.id,
    code: parsed.data.code,
    kind: parsed.data.kind,
    value,
    min_subtotal: minSubtotal,
    max_uses: maxUses,
    starts_at: starts.value,
    expires_at: expires.value,
    active: parsed.data.active === "on",
  });

  if (error) {
    return { status: "error", messageKey: messageKeyFor(error) };
  }

  revalidatePath(`/${locale}/app/discounts`);
  redirect(`/${locale}/app/discounts?created=1`);
}

/** Active ou désactive un code existant. */
export async function toggleDiscountAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  const id = field(formData, "id");
  const active = field(formData, "active") === "true";

  if (!id) redirect(`/${locale}/app/discounts`);

  const supabase = await createClient();
  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  await supabase
    .from("discount_codes")
    .update({ active })
    .eq("id", id)
    .eq("store_id", store.id);

  revalidatePath(`/${locale}/app/discounts`);
  redirect(`/${locale}/app/discounts?updated=1`);
}
