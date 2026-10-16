"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createStoreSchema } from "@/lib/stores/schema";
import type { StoreFormState } from "@/lib/stores/types";
import { toFieldErrors } from "@/lib/validation";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * Traduit le code d'erreur PostgreSQL en clé de message du dictionnaire.
 *
 * Les codes SQLSTATE sont stables et documentés, contrairement au texte des
 * messages : c'est sur eux, et jamais sur le message, que le tri se fait.
 */
function messageKeyFor(error: { code?: string }): string {
  // 23505 — un identifiant déjà pris. Le seul index unique de la table.
  if (error.code === "23505") return "slugTaken";
  // 28P01/28000 — la session a expiré entre l'affichage et l'envoi.
  if (error.code === "28000") return "sessionExpired";
  // 23514 — une contrainte de forme a résisté à la validation du formulaire.
  if (error.code === "23514") return "slugInvalid";

  return "serverError";
}

/**
 * Crée la boutique du marchand connecté.
 *
 * L'écriture ne passe pas par un `insert` : `create_store()` est la seule voie
 * ouverte, et c'est elle qui rend le créateur propriétaire dans la même
 * transaction. Le `store_id` n'est donc jamais fourni par le client.
 */
export async function createStoreAction(
  _previous: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> {
  const locale = field(formData, "locale") || "fr";

  const parsed = createStoreSchema.safeParse({
    name: field(formData, "name"),
    slug: field(formData, "slug"),
    country: field(formData, "country"),
    currency: field(formData, "currency"),
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();

  const { error } = await supabase.rpc("create_store", {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_country: parsed.data.country,
    p_currency: parsed.data.currency,
  });

  if (error) return { status: "error", messageKey: messageKeyFor(error) };

  // Le nom de la boutique s'affiche dans l'en-tête de tout l'espace marchand.
  revalidatePath("/", "layout");
  redirect(`/${locale}/app`);
}
