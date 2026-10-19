import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteObject } from "@/lib/r2/client";
import type { MediaKind } from "@/lib/r2/media";

/**
 * Supprime un média : sa ligne, puis son objet.
 *
 * La ligne part en premier. Un objet orphelin dans le bucket est invisible ;
 * une ligne qui pointe vers un objet absent afficherait une image cassée.
 */
export async function deleteMediaAsset(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { data } = await supabase
    .from("media_assets")
    .select("id, object_key, kind")
    .eq("id", id)
    .maybeSingle();

  if (!data) return;

  await supabase.from("media_assets").delete().eq("id", id);

  try {
    await deleteObject(data.object_key as string, data.kind as MediaKind);
  } catch {
    // Un échec côté bucket ne doit pas empêcher d'enregistrer le produit.
  }
}
