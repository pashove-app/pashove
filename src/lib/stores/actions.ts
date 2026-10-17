"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentOnboardingStep, onboardingPath } from "@/lib/onboarding/steps";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { currentStore } from "@/lib/stores/queries";
import { createStoreSchema, sellingSchema } from "@/lib/stores/schema";
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
 * Crée la boutique du marchand connecté, ou met à jour celle qui existe déjà.
 *
 * À la création, l'écriture ne passe pas par un `insert` : `create_store()` est
 * la seule voie ouverte, et c'est elle qui rend le créateur propriétaire dans la
 * même transaction. À la mise à jour, l'identifiant est lu côté serveur — la
 * politique RLS interdit d'écrire la boutique d'un autre de toute façon.
 */
export async function saveStoreAction(
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
  const existing = await currentStore();

  const { error } = existing
    ? await supabase
        .from("stores")
        .update({
          name: parsed.data.name,
          slug: parsed.data.slug,
          country: parsed.data.country,
          currency: parsed.data.currency,
        })
        .eq("id", existing.id)
    : await supabase.rpc("create_store", {
        p_name: parsed.data.name,
        p_slug: parsed.data.slug,
        p_country: parsed.data.country,
        p_currency: parsed.data.currency,
      });

  if (error) return { status: "error", messageKey: messageKeyFor(error) };

  // Le nom de la boutique s'affiche dans l'en-tête de tout l'espace marchand.
  revalidatePath("/", "layout");

  const step = await currentOnboardingStep();
  redirect(onboardingPath(locale, step));
}

/**
 * Étape 3 : ce que la boutique vend.
 *
 * Les cases à cocher arrivent sous un même nom, et `getAll` les rend toutes.
 * La boutique est lue côté serveur : le formulaire ne désigne jamais l'écran
 * qu'il modifie.
 */
export async function saveSellingAction(
  _previous: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> {
  const locale = field(formData, "locale") || "fr";

  const productTypes = formData
    .getAll("productType")
    .filter((value): value is string => typeof value === "string");

  const parsed = sellingSchema.safeParse({ productTypes });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const store = await currentStore();

  if (!store) return { status: "error", messageKey: "serverError" };

  const { error } = await supabase
    .from("stores")
    .update({ product_types: parsed.data.productTypes })
    .eq("id", store.id);

  if (error) return { status: "error", messageKey: "serverError" };

  revalidatePath("/", "layout");

  const step = await currentOnboardingStep();
  redirect(onboardingPath(locale, step));
}
