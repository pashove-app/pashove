import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  timezone: string;
};

/**
 * Le profil du compte connecté.
 *
 * Aucun filtre n'est écrit ici : la politique RLS ne laisse voir que sa propre
 * ligne, et `maybeSingle()` échouerait plutôt que de renvoyer celle d'un autre.
 */
export async function readProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, phone, timezone")
    .maybeSingle();

  return (data as Profile | null) ?? null;
}
