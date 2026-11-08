"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function resolveDeliveryDisputeAction(
  formData: FormData,
): Promise<void> {
  const id = field(formData, "id");
  const action = field(formData, "action");

  const supabase = await createClient();
  const { error } = await supabase.rpc("resolve_delivery_dispute", {
    p_delivery_id: id,
    p_action: action,
  });

  if (error) {
    console.error("[delivery] dispute resolution failed", error.message);
    redirect("/platform-admin/deliveries?error=1");
  }

  revalidatePath("/platform-admin/deliveries");
  revalidatePath("/", "layout");
  redirect(`/platform-admin/deliveries?ok=${action}`);
}
