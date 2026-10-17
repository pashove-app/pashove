import { readProfile } from "@/lib/profile/queries";
import { currentStore } from "@/lib/stores/queries";

export type OnboardingStep = "store" | "profile" | "selling" | "done";

/**
 * Première étape non satisfaite, déduite de ce qui existe réellement en base.
 *
 * Aucun compteur n'est stocké : une étape est faite dès que ses données
 * existent. C'est ce qui rend la reprise fiable — un marchand qui ferme son
 * navigateur retrouve l'endroit exact où il s'est arrêté, même si l'ordre des
 * écrans change entre-temps.
 */
export async function currentOnboardingStep(): Promise<OnboardingStep> {
  const store = await currentStore();
  if (!store) return "store";

  const profile = await readProfile();
  if (
    !profile ||
    !profile.full_name.trim() ||
    !profile.phone ||
    !profile.country
  ) {
    return "profile";
  }

  if (store.product_types.length === 0) return "selling";

  return "done";
}

/** Adresse de l'étape, ou de l'espace marchand une fois l'onboarding terminé. */
export function onboardingPath(locale: string, step: OnboardingStep): string {
  return step === "done" ? `/${locale}/app` : `/${locale}/onboarding/${step}`;
}
