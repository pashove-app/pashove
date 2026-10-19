"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parsePrice, productSchema } from "@/lib/products/schema";
import type { ProductFormState } from "@/lib/products/types";
import { currentStore } from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { toFieldErrors } from "@/lib/validation";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Traduit le code d'erreur PostgreSQL en clé de message du dictionnaire. */
function messageKeyFor(error: { code?: string }): string {
  // 23505 — le slug est déjà pris dans cette boutique.
  if (error.code === "23505") return "productSlugTaken";
  // 22023 — l'image n'appartient pas à cette boutique.
  if (error.code === "22023") return "productImageInvalid";
  // 23514 — une contrainte de forme a résisté à la validation du formulaire.
  if (error.code === "23514") return "productInvalid";

  return "serverError";
}

/**
 * Crée un produit et son image en une seule transaction.
 *
 * `create_product()` est la seule voie d'écriture : le produit et son image
 * naissent ensemble, et la RLS refuse toute boutique qui n'est pas la sienne.
 */
export async function createProductAction(
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const locale = field(formData, "locale") || "fr";

  const parsed = productSchema.safeParse({
    name: field(formData, "name"),
    slug: field(formData, "slug"),
    description: field(formData, "description"),
    price: field(formData, "price"),
    status: field(formData, "status"),
    mediaId: field(formData, "productMediaId"),
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const store = await currentStore();

  if (!store) return { status: "error", messageKey: "sessionExpired" };

  const price = parsePrice(parsed.data.price, store.currency);
  if (price === null) {
    return {
      status: "invalid",
      fieldErrors: { price: "productPriceInvalid" },
    };
  }

  const { error } = await supabase.rpc("create_product", {
    p_store_id: store.id,
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_description: parsed.data.description,
    p_price_amount: price,
    p_status: parsed.data.status,
    p_media_id: parsed.data.mediaId || null,
  });

  if (error) return { status: "error", messageKey: messageKeyFor(error) };

  // Le produit compte désormais dans le KPI de l'accueil.
  revalidatePath("/", "layout");
  redirect(`/${locale}/app/products?created=1`);
}
