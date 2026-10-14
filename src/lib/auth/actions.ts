"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { loginSchema, registerSchema, toFieldErrors } from "@/lib/validation";
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
