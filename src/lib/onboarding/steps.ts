import { readProfile } from "@/lib/profile/queries";
import { currentStore, listStores } from "@/lib/stores/queries";

export type OnboardingStep = "store" | "profile" | "selling" | "launch" | "done";

/**
 * Première étape non satisfaite, déduite de ce qui existe réellement en base.
 *
 * Aucun compteur n'est stocké : une étape est faite dès que ses données
 * existent. C'est ce qui rend la reprise fiable — un marchand qui ferme son
 * navigateur retrouve l'endroit exact où il s'est arrêté, même si l'ordre des
 * écrans change entre-temps.
 */
export async function currentOnboardingStep(): Promise<OnboardingStep> {
  const stores = await listStores();
  if (stores.length === 0) return "store";

  // Un compte qui possède déjà une boutique publiée a terminé son onboarding :
  // une deuxième boutique en brouillon se gère depuis le dashboard, sans
  // renvoyer le marchand dans le parcours de création.
  if (stores.some((entry) => entry.status !== "draft")) return "done";

  const store = await currentStore();
  if (!store) return "store";

  // Une boutique publiée — ou suspendue, donc déjà sortie du brouillon — ne
  // renvoie plus jamais vers l'onboarding, même si une donnée manquait :
  // sinon un marchand en ligne se retrouverait coincé.
  if (store.status !== "draft") return "done";

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

  return "launch";
}

/** Adresse de l'étape, ou de l'espace marchand une fois l'onboarding terminé. */
export function onboardingPath(locale: string, step: OnboardingStep): string {
  return step === "done" ? `/${locale}/app` : `/${locale}/onboarding/${step}`;
}
