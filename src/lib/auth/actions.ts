"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, toFieldErrors } from "@/lib/validation";
import type { AuthState } from "@/lib/auth/types";

/* ------------------------------------------------------------------ *
 *  Utilitaires
 * ------------------------------------------------------------------ */

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Traduit le code d'erreur Supabase en clé de message du dictionnaire. */
function messageKeyFor(error: {
  code?: string;
  status?: number;
  message?: string;
}): string {
  const code = error.code ?? "";

  if (code === "invalid_credentials") return "invalidCredentials";
  if (code === "user_already_exists" || code === "email_exists") return "emailTaken";
  if (code === "weak_password") return "weakPassword";
  if (code === "same_password") return "samePassword";
  if (code === "session_expired" || code === "refresh_token_not_found") {
    return "sessionExpired";
  }
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") {
    return "rateLimited";
  }
  if (error.status === 429) return "rateLimited";

  return error.status === 400 ? "invalidCredentials" : "serverError";
}

/** Adresse de retour utilisée dans les liens envoyés par e-mail. */
function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}

/* ------------------------------------------------------------------ *
 *  Connexion
 * ------------------------------------------------------------------ */

export async function signInAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = field(formData, "locale") || "fr";

  const parsed = loginSchema.safeParse({
    email: field(formData, "email"),
    password: field(formData, "password"),
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { status: "error", messageKey: messageKeyFor(error) };

  revalidatePath("/", "layout");
  redirect(`/${locale}/app`);
}

/* ------------------------------------------------------------------ *
 *  Inscription
 * ------------------------------------------------------------------ */

export async function signUpAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = field(formData, "locale") || "fr";

  const parsed = registerSchema.safeParse({
    fullName: field(formData, "fullName"),
    storeName: field(formData, "storeName"),
    email: field(formData, "email"),
    password: field(formData, "password"),
    phone: field(formData, "phone"),
    country: field(formData, "country"),
    referral: field(formData, "referral"),
    consent: field(formData, "consent") === "on",
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Repris plus tard par le trigger de création de profil côté base.
      data: {
        full_name: parsed.data.fullName,
        store_name: parsed.data.storeName,
        phone: parsed.data.phone,
        country: parsed.data.country,
        referral: parsed.data.referral || null,
      },
      emailRedirectTo: `${siteUrl()}/${locale}/auth/callback`,
    },
  });

  if (error) return { status: "error", messageKey: messageKeyFor(error) };

  // Confirmation d'e-mail active : aucune session n'est ouverte tant que le
  // lien n'a pas été cliqué.
  if (!data.session) {
    return { status: "check-email", email: parsed.data.email };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app`);
}

/* ------------------------------------------------------------------ *
 *  Mot de passe oublié
 * ------------------------------------------------------------------ */

/**
 * Un 400 n'a pas le même sens selon l'écran : « identifiants invalides » ne veut
 * rien dire sur un formulaire de réinitialisation. On y retombe sur l'erreur
 * générique plutôt que d'afficher un message absurde.
 */
function messageKeyForRecovery(error: {
  code?: string;
  status?: number;
  message?: string;
}): string {
  const key = messageKeyFor(error);
  return key === "invalidCredentials" ? "serverError" : key;
}

/**
 * Envoie le lien de réinitialisation.
 *
 * Supabase répond la même chose pour une adresse inconnue que pour une adresse
 * connue : on ne peut donc pas en déduire l'existence d'un compte, et on affiche
 * le même écran de confirmation dans les deux cas. Les vraies pannes (envoi
 * d'e-mail indisponible, débit trop rapide) restent visibles, elles.
 */
export async function requestPasswordResetAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = field(formData, "locale") || "fr";

  const parsed = forgotPasswordSchema.safeParse({ email: field(formData, "email") });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  // Le lien revient sur `/auth/callback`, qui ouvre la session puis renvoie vers
  // la page de choix du nouveau mot de passe.
  const next = `/${locale}/auth/reset-password`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/${locale}/auth/callback?next=${encodeURIComponent(next)}`,
  });

  if (error) return { status: "error", messageKey: messageKeyForRecovery(error) };

  return { status: "reset-sent", email: parsed.data.email };
}

/* ------------------------------------------------------------------ *
 *  Nouveau mot de passe
 * ------------------------------------------------------------------ */

/**
 * Remplace le mot de passe de la session en cours.
 *
 * Cette action ne demande pas l'ancien mot de passe : elle est faite pour le
 * retour d'un lien de réinitialisation, où l'utilisateur ne le connaît plus par
 * définition. Le changement depuis les paramètres de sécurité, lui, exigera
 * l'ancien mot de passe.
 */
export async function updatePasswordAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = field(formData, "locale") || "fr";

  const parsed = resetPasswordSchema.safeParse({
    password: field(formData, "password"),
    confirm: field(formData, "confirm"),
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Session absente ou expirée : le lien de réinitialisation a été consommé, ou
  // la page a été ouverte directement.
  if (!user) return { status: "error", messageKey: "sessionExpired" };

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) return { status: "error", messageKey: messageKeyForRecovery(error) };

  // Un mot de passe qui change doit fermer les sessions ouvertes ailleurs :
  // c'est le premier réflexe après une compromission, et le lien de
  // réinitialisation peut avoir été déclenché par quelqu'un d'autre.
  await supabase.auth.signOut({ scope: "others" });

  revalidatePath("/", "layout");
  redirect(`/${locale}/app`);
}

/* ------------------------------------------------------------------ *
 *  Déconnexion
 * ------------------------------------------------------------------ */

export async function signOutAction(formData: FormData): Promise<void> {
  const locale = field(formData, "locale") || "fr";

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/auth/login`);
}
