"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LOCALES } from "@/i18n/config";
import { deleteMediaAsset } from "@/lib/media/assets";
import { currentOnboardingStep, onboardingPath } from "@/lib/onboarding/steps";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ACTIVE_STORE_COOKIE, currentStore } from "@/lib/stores/queries";
import { parsePrice } from "@/lib/products/schema";
import { createStoreSchema, sellingSchema, storeSettingsSchema } from "@/lib/stores/schema";
import { geocodeAddress } from "@/lib/geo/geocode";
import type { StoreFormState, StoreSettingsState } from "@/lib/stores/types";
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
 * Étape 4 : publication de la boutique.
 *
 * Le statut passe de `draft` à `active` et `launched_at` garde la date de la
 * première mise en ligne — republier ne la réécrit pas. Une boutique publiée
 * ne repasse plus jamais par l'onboarding.
 */
export async function publishStoreAction(
  _previous: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> {
  const locale = field(formData, "locale") || "fr";

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const store = await currentStore();

  if (!store) return { status: "error", messageKey: "serverError" };

  const { error } = await supabase
    .from("stores")
    .update(
      store.status === "active"
        ? { status: "active" }
        : { status: "active", launched_at: new Date().toISOString() },
    )
    .eq("id", store.id);

  if (error) return { status: "error", messageKey: "serverError" };

  revalidatePath("/", "layout");
  redirect(`/${locale}/app/onboarding?published=1`);
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

/**
 * Réglages de la vitrine : description, contacts publics, visuels.
 *
 * Une valeur vide devient `null` — la vitrine masque alors le bloc ou reprend
 * son repli. Les pages de la vitrine sont revalidées dans les cinq langues
 * pour que la modification soit visible tout de suite, malgré le cache.
 */
export async function saveStoreSettingsAction(
  _previous: StoreSettingsState,
  formData: FormData,
): Promise<StoreSettingsState> {
  const locale = field(formData, "locale") || "fr";

  const parsed = storeSettingsSchema.safeParse({
    heroTitle: field(formData, "heroTitle"),
    heroSubtitle: field(formData, "heroSubtitle"),
    description: field(formData, "description"),
    contactEmail: field(formData, "contactEmail"),
    contactPhone: field(formData, "contactPhone"),
    storeAddress: field(formData, "storeAddress"),
    logoMediaId: field(formData, "logoMediaId"),
    bannerMediaId: field(formData, "bannerMediaId"),
    shippingFlat: field(formData, "shippingFlat"),
    codEnabled: field(formData, "codEnabled") === "on" ? "1" : "0",
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const store = await currentStore();

  if (!store) return { status: "error", messageKey: "sessionExpired" };

  const blankToNull = (value: string) =>
    value.trim() === "" ? null : value.trim();

  const logoMediaId = parsed.data.logoMediaId || null;
  const bannerMediaId = parsed.data.bannerMediaId || null;
  const storeAddress = blankToNull(parsed.data.storeAddress);

  // On ne relance le géocodage que si l'adresse a changé : une sauvegarde de
  // description ne doit pas dépendre du réseau OSM.
  let latitude = store.latitude ?? null;
  let longitude = store.longitude ?? null;

  if (
    storeAddress !== store.address ||
    (storeAddress !== null && latitude === null)
  ) {
    if (!storeAddress) {
      latitude = null;
      longitude = null;
    } else {
      const point = await geocodeAddress({
        address: storeAddress,
        country: store.country,
      });
      latitude = point?.latitude ?? null;
      longitude = point?.longitude ?? null;
    }
  }

  const shippingFlat =
    parsed.data.shippingFlat === ""
      ? 0
      : parsePrice(parsed.data.shippingFlat, store.currency);

  if (shippingFlat === null) {
    return {
      status: "invalid",
      fieldErrors: { shippingFlat: "shippingInvalid" },
    };
  }

  const { error } = await supabase
    .from("stores")
    .update({
      hero_title: blankToNull(parsed.data.heroTitle),
      hero_subtitle: blankToNull(parsed.data.heroSubtitle),
      description: blankToNull(parsed.data.description),
      contact_email: blankToNull(parsed.data.contactEmail),
      contact_phone: blankToNull(parsed.data.contactPhone),
      address: storeAddress,
      latitude,
      longitude,
      logo_media_id: logoMediaId,
      banner_media_id: bannerMediaId,
      shipping_flat_amount: shippingFlat,
      cod_enabled: parsed.data.codEnabled === "1",
    })
    .eq("id", store.id);

  if (error) return { status: "error", messageKey: "serverError" };

  // Une image remplacée ou retirée ne doit pas rester dans le bucket.
  const replaced = [store.logo_media_id, store.banner_media_id].filter(
    (id): id is string => Boolean(id) && id !== logoMediaId && id !== bannerMediaId,
  );

  for (const id of replaced) {
    await deleteMediaAsset(supabase, id);
  }

  revalidatePath(`/${locale}/app/settings/store`);
  revalidatePath(`/${locale}/app`);

  // La vitrine est mise en cache une minute : on invalide explicitement les
  // cinq langues pour que la modification soit visible immédiatement.
  for (const code of LOCALES) {
    revalidatePath(`/${code}/store/${store.slug}`);
  }

  return { status: "saved" };
}

/* ------------------------------------------------------------------ *
 *  Multi-boutiques
 * ------------------------------------------------------------------ */

/** Mémorise la boutique active après avoir vérifié l'appartenance. */
async function rememberStore(id: string): Promise<void> {
  (await cookies()).set(ACTIVE_STORE_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function switchStoreAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";
  const storeId = field(formData, "storeId");

  if (!storeId) redirect(`/${locale}/app`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const { data } = await supabase
    .from("store_members")
    .select("store_id")
    .eq("user_id", user.id)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!data) redirect(`/${locale}/app`);

  await rememberStore(storeId);
  revalidatePath("/", "layout");
  redirect(`/${locale}/app`);
}

/**
 * Crée une boutique supplémentaire puis l'active.
 *
 * La limite du plan est revérifiée dans `create_store()` en base : le
 * formulaire ne peut pas la contourner.
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
  const { data, error } = await supabase.rpc("create_additional_store", {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_country: parsed.data.country,
    p_currency: parsed.data.currency,
  });

  if (error || !data) {
    const message = error?.message ?? "";

    if (message.includes("store_limit_reached")) {
      return { status: "error", messageKey: "limitReached" };
    }
    if (error?.code === "23505") {
      return { status: "invalid", fieldErrors: { slug: "slugTaken" } };
    }
    if (error?.code === "23514") {
      return { status: "invalid", fieldErrors: { slug: "slugInvalid" } };
    }

    return { status: "error", messageKey: "serverError" };
  }

  // Une boutique créée depuis le dashboard n'a pas encore traversé l'étape
  // « mode de vente » : on autorise les trois types par défaut.
  await supabase
    .from("stores")
    .update({ product_types: ["physical", "digital", "service"] })
    .eq("id", data as string);

  await rememberStore(data as string);
  revalidatePath("/", "layout");
  redirect(`/${locale}/app`);
}
