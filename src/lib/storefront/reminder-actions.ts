"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { readCartToken } from "@/lib/storefront/cart";
import { createPublicClient } from "@/lib/supabase/public";

export type ReminderState = {
  status: "idle" | "saved" | "error";
  message?: string;
};

const emailSchema = z.string().trim().email().max(254);

export async function saveCartReminderAction(
  _previous: ReminderState,
  formData: FormData,
): Promise<ReminderState> {
  const token = await readCartToken();
  const parsed = emailSchema.safeParse(formData.get("email"));

  if (!token) return { status: "error", message: "Panier introuvable." };
  if (!parsed.success) {
    return { status: "error", message: "Adresse e-mail invalide." };
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("save_cart_reminder", {
    p_token: token,
    p_email: parsed.data,
  });

  if (error || data !== true) {
    return { status: "error", message: "Impossible d’enregistrer le rappel." };
  }

  revalidatePath("/", "layout");
  return { status: "saved" };
}
