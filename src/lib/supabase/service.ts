import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase à privilèges de service.
 *
 * Il contourne RLS : il ne doit jamais servir à lire ou écrire des données
 * marchandes au nom d'un utilisateur. Son seul usage est l'infrastructure —
 * ici, la boîte d'envoi des e-mails et la recherche de l'adresse du
 * propriétaire d'une boutique.
 *
 * La clé vit uniquement côté serveur. Si elle est absente (poste de
 * développement, par exemple), les fonctions qui en dépendent se désactivent
 * proprement au lieu de faire échouer le parcours utilisateur.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isServiceConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
