"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { loginSchema, registerSchema, emailOnlySchema, resetPasswordSchema, totpCodeSchema, verifyEmailSchema, toFieldErrors } from "@/lib/validation";
import { clearPendingEmail, rememberPendingEmail } from "@/lib/auth/pending-email";
import type { AuthState, TotpEnrollmentState } from "@/lib/auth/types";

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
  // code ou le lien n'a pas été validé. On retient l'adresse pour que l'écran de
  // vérification sache quoi vérifier, et puisse renvoyer un code.
  if (!data.session) {
    await rememberPendingEmail(parsed.data.email);
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

  const parsed = emailOnlySchema.safeParse({ email: field(formData, "email") });

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
 *  Confirmation d'adresse
 * ------------------------------------------------------------------ */

/**
 * Traduit une erreur de jeton à usage unique.
 *
 * `expiredKey` varie selon le support : un code à recopier et un lien cliqué ne
 * se réparent pas de la même façon, même si Supabase renvoie la même erreur.
 */
function otpMessageKey(
  error: { code?: string; status?: number; message?: string },
  expiredKey: string,
): string {
  switch (error.code) {
    case "otp_expired":
      return expiredKey;
    case "invalid_otp":
    case "otp_disabled":
      return "emailCodeInvalid";
    case "session_expired":
    case "refresh_token_not_found":
      return "sessionExpired";
    default:
      // Un jeton erroné revient en 403 sans code d'erreur exploitable.
      return error.status === 403 ? expiredKey : "serverError";
  }
}

/**
 * Renvoie le code de confirmation.
 *
 * La réponse est la même que l'adresse corresponde à un compte en attente ou
 * non : Supabase ne le dit pas, et l'écran ne doit pas le dire non plus. Le cas
 * « adresse déjà confirmée » est avalé pour la même raison — le signaler
 * reviendrait à confirmer l'existence du compte.
 */
export async function resendVerificationAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = field(formData, "locale") || "fr";

  const parsed = emailOnlySchema.safeParse({ email: field(formData, "email") });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${siteUrl()}/${locale}/auth/callback` },
  });

  if (error && error.code !== "user_already_confirmed") {
    // Seule la limitation de débit est signalée : elle est actionnable, et elle
    // ne dit rien sur l'existence du compte.
    if (messageKeyForRecovery(error) === "rateLimited") {
      return { status: "error", messageKey: "rateLimited" };
    }
  }

  await rememberPendingEmail(parsed.data.email);
  return { status: "code-sent", email: parsed.data.email };
}

/** Valide le code reçu par e-mail : c'est lui qui ouvre la session. */
export async function verifyEmailCodeAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = field(formData, "locale") || "fr";

  const parsed = verifyEmailSchema.safeParse({
    email: field(formData, "email"),
    code: field(formData, "code"),
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.code,
    type: "signup",
  });

  if (error) return { status: "error", messageKey: otpMessageKey(error, "emailCodeExpired") };

  await clearPendingEmail();
  revalidatePath("/", "layout");
  redirect(`/${locale}/app`);
}

/* ------------------------------------------------------------------ *
 *  Confirmation par lien
 * ------------------------------------------------------------------ */

/**
 * Consomme le jeton d'un lien reçu par e-mail — **au clic, jamais au chargement**.
 *
 * Le lien envoyé par Supabase (`{{ .ConfirmationURL }}`) vérifie le jeton dès
 * qu'il est ouvert. Or les messageries pré-visitent les liens pour détecter les
 * pages malveillantes : le jeton est alors consommé par le robot, et l'adresse
 * de l'utilisateur reste non confirmée sans qu'il ait rien fait. Les gabarits
 * d'e-mail pointent donc vers notre page, qui n'exécute cette action que sur le
 * bouton.
 */
export async function confirmEmailTokenAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = field(formData, "locale") || "fr";
  const tokenHash = field(formData, "token_hash");
  const requested = field(formData, "type");

  // `email` et `signup` désignent la même chose selon la façon dont le gabarit
  // a été écrit : on accepte les deux.
  const type =
    requested === "recovery" ? "recovery" : requested === "signup" || requested === "email" ? "signup" : null;

  if (!tokenHash || !type) return { status: "error", messageKey: "confirmTokenInvalid" };
  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    return { status: "error", messageKey: otpMessageKey(error, "confirmTokenInvalid") };
  }

  revalidatePath("/", "layout");

  // Un lien de réinitialisation ouvre une session : elle sert à choisir le
  // nouveau mot de passe, pas à entrer dans l'espace marchand.
  if (type === "recovery") redirect(`/${locale}/auth/reset-password`);

  await clearPendingEmail();
  redirect(`/${locale}/app`);
}

/* ------------------------------------------------------------------ *
 *  Second facteur (TOTP)
 * ------------------------------------------------------------------ */

/**
 * Traduit une erreur MFA en clé de message.
 *
 * Pas de repli sur `messageKeyFor` ici : un 400 y devient « identifiants
 * invalides », ce qui n'a aucun sens sur un écran de code à six chiffres.
 */
function mfaMessageKey(error: {
  code?: string;
  status?: number;
  message?: string;
}): string {
  switch (error.code) {
    case "mfa_verification_failed":
    case "invalid_mfa_code":
      return "totpInvalid";
    case "mfa_challenge_expired":
      return "totpExpired";
    case "too_many_enrolled_mfa_factors":
      return "totpTooMany";
    case "mfa_totp_enroll_not_enabled":
    case "mfa_enroll_not_enabled":
      return "totpDisabled";
    case "insufficient_aal":
      return "totpVerifyFirst";
    case "session_expired":
    case "refresh_token_not_found":
      return "sessionExpired";
    default:
      return "serverError";
  }
}

/**
 * Ouvre un enrôlement TOTP et renvoie de quoi le présenter.
 *
 * L'enrôlement écrit en base : il ne peut donc pas se produire pendant le rendu
 * d'une page, qu'un préchargement ou un double rendu déclencherait deux fois.
 * Il passe par une action, déclenchée par un bouton.
 */
export async function startTotpEnrollmentAction(
  _previous: TotpEnrollmentState,
  _formData: FormData,
): Promise<TotpEnrollmentState> {
  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", messageKey: "sessionExpired" };

  // Un enrôlement abandonné en chemin laisse un facteur non confirmé, et ils
  // s'accumulent à chaque tentative. On fait le ménage avant d'en créer un.
  const { data: existing } = await supabase.auth.mfa.listFactors();

  for (const factor of existing?.all ?? []) {
    if (factor.factor_type === "totp" && factor.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Pashove",
  });

  if (error || !data) return { status: "error", messageKey: mfaMessageKey(error ?? {}) };

  return {
    status: "enrolling",
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

/** Confirme l'enrôlement : c'est ce premier code qui rend le facteur actif. */
export async function verifyTotpEnrollmentAction(
  _previous: TotpEnrollmentState,
  formData: FormData,
): Promise<TotpEnrollmentState> {
  const locale = field(formData, "locale") || "fr";
  const factorId = field(formData, "factorId");

  const parsed = totpCodeSchema.safeParse({ code: field(formData, "code") });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!factorId) return { status: "error", messageKey: "serverError" };
  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", messageKey: "sessionExpired" };

  // Défi et vérification en un seul appel : le défi expire vite, le séparer
  // ferait échouer un formulaire resté ouvert trop longtemps.
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: parsed.data.code,
  });

  if (error) {
    // `factorId` est renvoyé pour que le QR code reste affiché après un code
    // erroné : sans lui, l'utilisateur devrait tout recommencer.
    return { status: "error", messageKey: mfaMessageKey(error), factorId };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/app`);
}

/** Désactive la 2FA. Le prochain enrôlement repartira de zéro. */
export async function disableTotpAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = field(formData, "locale") || "fr";
  const factorId = field(formData, "factorId");

  if (!factorId) return { status: "error", messageKey: "serverError" };
  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", messageKey: "sessionExpired" };

  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return { status: "error", messageKey: mfaMessageKey(error) };

  revalidatePath(`/${locale}/auth/2fa/setup`);
  return { status: "idle" };
}

/** Deuxième étape de la connexion : la session passe de `aal1` à `aal2`. */
export async function verifyTotpChallengeAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = field(formData, "locale") || "fr";
  const factorId = field(formData, "factorId");

  const parsed = totpCodeSchema.safeParse({ code: field(formData, "code") });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!factorId) return { status: "error", messageKey: "serverError" };
  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", messageKey: "sessionExpired" };

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: parsed.data.code,
  });

  if (error) return { status: "error", messageKey: mfaMessageKey(error) };

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
