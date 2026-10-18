import { createClient } from "@/lib/supabase/server";

/** Une boutique telle que la lisent les écrans du marchand. */
export type Store = {
  id: string;
  name: string;
  slug: string;
  country: string;
  currency: string;
  category: string | null;
  status: "draft" | "active" | "suspended";
  product_types: string[];
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  logo_media_id: string | null;
  banner_media_id: string | null;
  /** Clé R2 de l'image, lue par jointure — l'URL publique s'en déduit. */
  logo: { object_key: string } | null;
  banner: { object_key: string } | null;
  created_at: string;
};

const COLUMNS = [
  "id, name, slug, country, currency, category, status, product_types",
  "description, contact_email, contact_phone",
  "logo_media_id, banner_media_id",
  "logo:media_assets!logo_media_id(object_key)",
  "banner:media_assets!banner_media_id(object_key)",
  "created_at",
].join(", ");

/**
 * Les boutiques de l'utilisateur connecté.
 *
 * Aucun filtre n'est écrit ici, et c'est délibéré : ce sont les politiques RLS
 * qui restreignent les lignes. Un `where user_id = …` côté application serait
 * contournable ; une politique en base, non. La fonction reste donc utile même
 * dans un contexte où l'identité serait mal établie — elle renverrait zéro ligne.
 */
export async function listStores(): Promise<Store[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("stores")
    .select(COLUMNS)
    .order("created_at", { ascending: true });

  // Le client Supabase n'est pas typé : la forme renvoyée est vérifiée par le
  // select ci-dessus, pas par le compilateur.
  return (data ?? []) as unknown as Store[];
}

/**
 * La boutique courante.
 *
 * Tant qu'un marchand n'a qu'une boutique, c'est la première créée. Le
 * sélecteur multi-boutiques viendra se poser ici, et non dans chaque écran.
 */
export async function currentStore(): Promise<Store | null> {
  const stores = await listStores();
  return stores[0] ?? null;
}
