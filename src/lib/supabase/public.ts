import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase de la vitrine publique.
 *
 * Aucune session, aucun cookie : une page publique ne doit pas dépendre du
 * visiteur. C'est ce qui permet de la pré-rendre et de la mettre en cache.
 * La clé anonyme ne donne accès qu'à ce que les politiques RLS ouvrent — ici,
 * les seules boutiques au statut `active`.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

export function isPublicSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
