"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentOnboardingStep, onboardingPath } from "@/lib/onboarding/steps";
import { profileSchema } from "@/lib/profile/schema";
import type { ProfileFormState } from "@/lib/profile/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { toFieldErrors } from "@/lib/validation";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * Enregistre le profil du marchand connecté.
 *
 * L'identifiant de la ligne vient de la session, jamais du formulaire — et la
 * politique RLS refuserait de toute façon d'écrire ailleurs.
 */
export async function saveProfileAction(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const locale = field(formData, "locale") || "fr";

  const parsed = profileSchema.safeParse({
    fullName: field(formData, "fullName"),
    phone: field(formData, "phone"),
    timezone: field(formData, "timezone"),
  });

  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error) };
  }

  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", messageKey: "sessionExpired" };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      timezone: parsed.data.timezone,
    })
    .eq("id", user.id);

  if (error) return { status: "error", messageKey: "serverError" };

  revalidatePath("/", "layout");

  // L'étape suivante se déduit de la base, pas d'un numéro mémorisé.
  const step = await currentOnboardingStep();
  redirect(onboardingPath(locale, step));
}
