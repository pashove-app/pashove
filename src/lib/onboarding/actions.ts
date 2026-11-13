"use server";

import { revalidatePath } from "next/cache";
import { currentStore } from "@/lib/stores/queries";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboardingStepAction(
  formData: FormData,
): Promise<void> {
  const step = formData.get("step");
  if (typeof step !== "string") return;

  const store = await currentStore();
  if (!store) return;

  const supabase = await createClient();
  await supabase.rpc("complete_onboarding_step", {
    p_store_id: store.id,
    p_step_key: step,
  });

  revalidatePath("/", "layout");
}
