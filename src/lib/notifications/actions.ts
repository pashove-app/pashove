"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationsReadAction(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_notifications_read", {
    p_ids: null,
  });

  if (error) {
    console.error("[notifications] mark read failed", error.message);
  }

  revalidatePath("/", "layout");
}
