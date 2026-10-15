import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Second facteur (TOTP).
 *
 * Supabase appelle « niveau d'assurance » l'état d'une session : `aal1` après un
 * simple mot de passe, `aal2` une fois le code de l'application d'authentification
 * validé. Un utilisateur qui a activé la 2FA doit passer `aal2` avant d'atteindre
 * l'espace marchand — sinon un mot de passe volé suffirait.
 */

/** Le compte a-t-il un facteur TOTP confirmé ? */
export function hasVerifiedTotp(user: User | null | undefined): boolean {
  return (user?.factors ?? []).some(
    (factor) => factor.factor_type === "totp" && factor.status === "verified",
  );
}

/** Identifiant du facteur confirmé, s'il existe. */
export function verifiedTotpId(
  factors: { id: string; factor_type: string; status: string }[] | undefined,
): string | undefined {
  return factors?.find(
    (factor) => factor.factor_type === "totp" && factor.status === "verified",
  )?.id;
}

/**
 * Renvoie vers la saisie du code tant que la session n'a pas franchi la 2FA.
 *
 * À appeler en tête de chaque page protégée. `user` est passé en paramètre pour
 * que la décision s'appuie sur la liste de facteurs fraîchement lue côté serveur,
 * et non sur celle, potentiellement périmée, mémorisée dans le cookie de session.
 *
 * Le jour où l'espace marchand comptera plusieurs pages, ce contrôle a vocation à
 * remonter dans le proxy : un garde-fou qu'il faut penser à appeler finit par être
 * oublié.
 */
export async function requireSecondFactor(
  locale: string,
  user: User | null | undefined,
): Promise<void> {
  if (!hasVerifiedTotp(user)) return;

  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (data?.currentLevel !== "aal2") redirect(`/${locale}/auth/2fa`);
}
