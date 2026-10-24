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
  hero_title: string | null;
  hero_subtitle: string | null;
  logo_url: string | null;
  banner_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  logo_media_id: string | null;
  banner_media_id: string | null;
  /** Frais fixes de livraison, en unité mineure. 0 = offerte. */
  shipping_flat_amount: number;
  /** Paiement à la livraison proposé au checkout. */
  cod_enabled: boolean;
  /** Clé R2 de l'image, lue par jointure — l'URL publique s'en déduit. */
  logo: { object_key: string } | null;
  banner: { object_key: string } | null;
  created_at: string;
};

const COLUMNS = [
  "id, name, slug, country, currency, category, status, product_types",
  "description, hero_title, hero_subtitle, contact_email, contact_phone",
  "logo_media_id, banner_media_id, shipping_flat_amount, cod_enabled",
  "logo:media_assets!logo_media_id(object_key)",
  "banner:media_assets!banner_media_id(object_key)",
  "created_at",
].join(", ");

/**
 * Les boutiques de l'utilisateur connecté.
 *
 * On part de `store_members`, pas de `stores` : la politique publique de
 * `stores` rend visibles toutes les boutiques actives (c'est voulu pour la
 * vitrine), y compris celles d'autres comptes. Lire `stores` directement
 * ferait donc remonter la boutique active la plus ancienne, quel qu'en soit le
 * propriétaire. La table des membres, elle, ne renvoie que les siennes — et sa
 * RLS confirme la même règle en base.
 */
export async function listStores(): Promise<Store[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("store_members")
    .select(`role, store:stores!store_id(${COLUMNS})`)
    .eq("user_id", user.id);

  // Le client Supabase n'est pas typé : la forme renvoyée est vérifiée par le
  // select ci-dessus, pas par le compilateur.
  const rows = (data ?? []) as unknown as { store: Store | null }[];

  return rows
    .map((row) => row.store)
    .filter((store): store is Store => Boolean(store))
    .sort((left, right) => left.created_at.localeCompare(right.created_at));
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
