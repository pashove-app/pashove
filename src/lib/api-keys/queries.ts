import { createClient } from "@/lib/supabase/server";

export type ApiKeyRecord = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export async function listApiKeys(storeId: string): Promise<ApiKeyRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("api_keys")
    .select("id, name, prefix, scopes, last_used_at, revoked_at, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as ApiKeyRecord[];
}
