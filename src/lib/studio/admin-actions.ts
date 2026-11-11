"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PATH = "/platform-admin/studio";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateStudioPricingAction(
  formData: FormData,
): Promise<void> {
  const actionType = field(formData, "actionType");
  const price = Number(field(formData, "price"));

  if (
    !actionType ||
    !Number.isInteger(price) ||
    price < 0 ||
    price > 1000000
  ) {
    redirect(`${PATH}?error=invalid`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_studio_pricing", {
    p_action_type: actionType,
    p_price_fcfa: price,
  });

  if (error) {
    console.error("[studio] update pricing failed", error.message);
    redirect(`${PATH}?error=save`);
  }

  revalidatePath(PATH);
  revalidatePath("/", "layout");
  redirect(`${PATH}?ok=1`);
}

export async function creditStudioAction(formData: FormData): Promise<void> {
  const storeId = field(formData, "storeId");
  const amount = Number(field(formData, "amount"));
  const reason = field(formData, "reason").slice(0, 200);

  if (
    !storeId ||
    !Number.isInteger(amount) ||
    amount <= 0 ||
    amount > 1000000
  ) {
    redirect(`${PATH}/${storeId || ""}?error=invalid`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_credit_studio", {
    p_store_id: storeId,
    p_amount: amount,
    p_reason: reason || null,
  });

  if (error) {
    console.error("[studio] credit failed", error.message);
    redirect(`${PATH}/${storeId}?error=save`);
  }

  revalidatePath(`${PATH}/${storeId}`);
  revalidatePath(PATH);
  revalidatePath("/", "layout");
  redirect(`${PATH}/${storeId}?ok=1`);
}
