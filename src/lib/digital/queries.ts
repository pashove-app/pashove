import { createClient } from "@/lib/supabase/server";

export type DigitalVersion = {
  id: string;
  version: number;
  notes: string | null;
  created_at: string;
  file_name: string | null;
};

export async function listDigitalVersions(
  productId: string,
): Promise<DigitalVersion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_digital_versions")
    .select("id, version, notes, created_at, media:media_assets(file_name)")
    .eq("product_id", productId)
    .order("version", { ascending: false });

  return ((data ?? []) as unknown as {
    id: string;
    version: number;
    notes: string | null;
    created_at: string;
    media: { file_name: string | null } | { file_name: string | null }[] | null;
  }[]).map((row) => {
    const media = Array.isArray(row.media) ? row.media[0] : row.media;
    return {
      id: row.id,
      version: row.version,
      notes: row.notes,
      created_at: row.created_at,
      file_name: media?.file_name ?? null,
    };
  });
}
