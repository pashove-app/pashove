"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { currentStore } from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type InventoryActionState = {
  status: "idle" | "saved" | "error";
  messageKey?: string;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const adjustSchema = z.object({
  productId: z.string().regex(UUID),
  variantId: z.string().regex(UUID).optional().or(z.literal("")),
  locationId: z.string().regex(UUID).optional().or(z.literal("")),
  delta: z.coerce.number().int().refine((value) => value !== 0, "delta"),
  reason: z.enum(["adjustment", "restock", "transfer", "initial"]),
  note: z.string().max(300).optional(),
});

function value(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function messageFor(error: { message?: string }): string {
  const message = error.message ?? "";
  if (message.includes("stock_negative")) return "stockNegative";
  if (message.includes("product_not_physical")) return "notPhysical";
  if (message.includes("not_allowed")) return "notAllowed";
  if (message.includes("delta_invalid")) return "deltaInvalid";
  if (message.includes("variant_required")) return "deltaInvalid";
  return "actionFailed";
}

export async function adjustInventoryAction(
  _previous: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  if (!isSupabaseConfigured()) return { status: "error", messageKey: "actionFailed" };

  const store = await currentStore();
  if (!store) return { status: "error", messageKey: "notAllowed" };

  const parsed = adjustSchema.safeParse({
    productId: value(formData, "productId"),
    variantId: value(formData, "variantId"),
    locationId: value(formData, "locationId"),
    delta: value(formData, "delta"),
    reason: value(formData, "reason"),
    note: value(formData, "note"),
  });

  if (!parsed.success) {
    return { status: "error", messageKey: "deltaInvalid" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("adjust_inventory", {
    p_store_id: store.id,
    p_product_id: parsed.data.productId,
    p_variant_id: parsed.data.variantId || null,
    p_location_id: parsed.data.locationId || null,
    p_delta: parsed.data.delta,
    p_reason: parsed.data.reason,
    p_note: parsed.data.note || null,
  });

  if (error) {
    return { status: "error", messageKey: messageFor(error) };
  }

  revalidatePath("/", "layout");
  return { status: "saved", messageKey: "adjustSaved" };
}

const locationSchema = z.object({
  locale: z.string().max(5).default("fr"),
  name: z.string().trim().min(2).max(60),
  kind: z.enum(["warehouse", "shop", "other"]),
});

export async function createLocationAction(formData: FormData): Promise<void> {
  const parsed = locationSchema.safeParse({
    locale: value(formData, "locale"),
    name: value(formData, "name"),
    kind: value(formData, "kind"),
  });

  if (!parsed.success) {
    redirect(`/${value(formData, "locale") || "fr"}/app/inventory?error=location`);
  }

  const store = await currentStore();
  if (!store) redirect("/fr/onboarding/store");

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_inventory_location", {
    p_store_id: store.id,
    p_name: parsed.data.name,
    p_kind: parsed.data.kind,
    p_is_default: false,
  });

  revalidatePath("/", "layout");
  redirect(
    `/${parsed.data.locale}/app/inventory${error ? "?error=location" : "?ok=location"}`,
  );
}

export async function setDefaultLocationAction(formData: FormData): Promise<void> {
  const locale = value(formData, "locale") || "fr";
  const locationId = value(formData, "locationId");
  if (!UUID.test(locationId)) redirect(`/${locale}/app/inventory?error=location`);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const supabase = await createClient();
  await supabase.rpc("set_default_inventory_location", {
    p_store_id: store.id,
    p_location_id: locationId,
  });

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/inventory`);
}
