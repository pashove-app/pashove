import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase côté navigateur. Réservé aux cas où l'on a besoin de
 * s'abonner à l'état d'authentification dans un composant client — les
 * connexions et inscriptions passent par des Server Actions.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
