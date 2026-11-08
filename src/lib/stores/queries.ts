import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/** Rôle du membre sur une boutique. */
export type StoreRole = "owner" | "admin" | "product_manager" | "staff";

/** Cookie de la boutique active. Le serveur choisit, le client ne devine pas. */
export const ACTIVE_STORE_COOKIE = "pashove_store";

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
  /** Qui supporte les frais SasPay (Standard/Pro). */
  fee_charge_mode: "client" | "merchant";
  /** Option « acheter comme cadeau » proposée au checkout. */
  gift_enabled: boolean;
  /** Clé R2 de l'image, lue par jointure — l'URL publique s'en déduit. */
  logo: { object_key: string } | null;
  banner: { object_key: string } | null;
  created_at: string;
};

const COLUMNS = [
  "id, name, slug, country, currency, category, status, product_types",
  "description, hero_title, hero_subtitle, contact_email, contact_phone",
  "logo_media_id, banner_media_id, shipping_flat_amount, cod_enabled, gift_enabled, fee_charge_mode",
  "logo:media_assets!logo_media_id(object_key)",
  "banner:media_assets!banner_media_id(object_key)",
  "created_at",
].join(", ");

export type StoreMembership = {
  role: StoreRole;
  store: Store;
};

/**
 * Les boutiques de l'utilisateur connecté, avec son rôle sur chacune.
 *
 * On part de `store_members`, pas de `stores` : la politique publique de
 * `stores` rend visibles toutes les boutiques actives (c'est voulu pour la
 * vitrine), y compris celles d'autres comptes. Lire `stores` directement
 * ferait donc remonter la boutique active la plus ancienne, quel qu'en soit le
 * propriétaire. La table des membres, elle, ne renvoie que les siennes — et sa
 * RLS confirme la même règle en base.
 */
export async function listStoreMemberships(): Promise<StoreMembership[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const query = (columns: string) =>
    supabase
      .from("store_members")
      .select(`role, store:stores!store_id(${columns})`)
      .eq("user_id", user.id);

  const primary = await query(COLUMNS);
  let data = primary.data;

  // Déploiement du code avant la migration : la colonne `fee_charge_mode`
  // peut manquer. On relit sans elle plutôt que de vider l'espace marchand.
  if (primary.error) {
    const fallback = await query(COLUMNS.replace(", fee_charge_mode", ""));
    data = fallback.data;
  }

  // Le client Supabase n'est pas typé : la forme renvoyée est vérifiée par le
  // select ci-dessus, pas par le compilateur.
  const rows = (data ?? []) as unknown as {
    role: StoreRole;
    store: Store | null;
  }[];

  return rows
    .filter(
      (row): row is { role: StoreRole; store: Store } => Boolean(row.store),
    )
    .map((row) => ({
      ...row,
      store: {
        ...row.store,
        fee_charge_mode: row.store.fee_charge_mode ?? "merchant",
      },
    }))
    .sort((left, right) =>
      left.store.created_at.localeCompare(right.store.created_at),
    );
}

/** Les boutiques seules, dans l'ordre de création. */
export async function listStores(): Promise<Store[]> {
  return (await listStoreMemberships()).map((membership) => membership.store);
}

/**
 * La boutique active et le rôle du membre.
 *
 * Le cookie `pashove_store` est validé contre les appartenances réelles : un
 * identifiant forgé retombe sur la première boutique, jamais sur celle d'un
 * autre compte.
 */
export async function currentMembership(): Promise<StoreMembership | null> {
  const memberships = await listStoreMemberships();
  if (memberships.length === 0) return null;

  const active = (await cookies()).get(ACTIVE_STORE_COOKIE)?.value;

  return (
    memberships.find((membership) => membership.store.id === active) ??
    memberships[0]
  );
}

/**
 * La boutique courante.
 *
 * Les écrans métier n'ont pas besoin du rôle ; ils passent par cette fonction.
 */
export async function currentStore(): Promise<Store | null> {
  return (await currentMembership())?.store ?? null;
}

/** Droits minimaux pour gérer l'équipe et les invitations. */
export function canManageTeam(role: StoreRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

/** Droits minimaux pour le catalogue. */
export function canManageCatalog(role: StoreRole | null | undefined): boolean {
  return role === "owner" || role === "admin" || role === "product_manager";
}
