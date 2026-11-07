"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentStore } from "@/lib/stores/queries";

export type MarketsState = {
  status: "idle" | "saved" | "error";
  message?: string;
};

export async function saveMarketsAction(
  _previous: MarketsState,
  formData: FormData,
): Promise<MarketsState> {
  const store = await currentStore();
  if (!store) return { status: "error", message: "Boutique introuvable." };

  const codes = formData
    .getAll("markets")
    .map((value) => String(value))
    .filter(Boolean);

  if (codes.length === 0) {
    return { status: "error", message: "Active au moins un pays." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_store_markets", {
    p_store_id: store.id,
    p_codes: codes,
    p_cod_enabled: formData.get("codEnabled") === "on",
  });

  if (error) {
    return { status: "error", message: "Enregistrement impossible." };
  }

  revalidatePath("/", "layout");
  return { status: "saved", message: "Pays enregistrés." };
}
