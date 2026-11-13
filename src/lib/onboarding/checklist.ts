import { createClient } from "@/lib/supabase/server";
import { readProfile } from "@/lib/profile/queries";
import { listPublishedPolicySlugs } from "@/lib/policies/queries";
import { getPublicStoreTheme } from "@/lib/theme/queries";
import type { Store } from "@/lib/stores/queries";

export type ChecklistStep = {
  key: string;
  label: string;
  description: string;
  href: string;
  manual: boolean;
  done: boolean;
};

async function count(
  table: string,
  storeId: string,
  column = "store_id",
): Promise<number> {
  const supabase = await createClient();
  const { count: total } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, storeId);
  return total ?? 0;
}

/** Construit les 15 étapes à partir de l'état réel de la boutique. */
export async function getOnboardingChecklist(
  store: Store,
  locale: string,
): Promise<ChecklistStep[]> {
  const supabase = await createClient();

  const [
    profile,
    productCount,
    orderCount,
    payoutMethods,
    members,
    kyc,
    policies,
    theme,
    progress,
  ] = await Promise.all([
    readProfile(),
    count("products", store.id),
    count("orders", store.id),
    count("payout_methods", store.id),
    count("store_members", store.id),
    supabase
      .from("kyc_cases")
      .select("status")
      .eq("store_id", store.id)
      .eq("status", "approved")
      .maybeSingle()
      .then((result) => Boolean(result.data)),
    listPublishedPolicySlugs(store.id),
    getPublicStoreTheme(store.slug),
    supabase
      .from("onboarding_progress")
      .select("step_key")
      .eq("store_id", store.id)
      .then((result) =>
        new Set((result.data ?? []).map((row) => row.step_key as string)),
      ),
  ]);

  const done = (key: string) => progress.has(key);

  return [
    {
      key: "store",
      label: "Créer la boutique",
      description: "Nom, pays, devise et catégorie.",
      href: `/${locale}/onboarding/store`,
      manual: false,
      done: true,
    },
    {
      key: "profile",
      label: "Compléter ton profil",
      description: "Coordonnées et préférences du compte.",
      href: `/${locale}/onboarding/profile`,
      manual: false,
      done: Boolean(profile),
    },
    {
      key: "selling",
      label: "Choisir ce que tu vends",
      description: "Produits physiques, numériques ou services.",
      href: `/${locale}/onboarding/selling`,
      manual: false,
      done: store.product_types.length > 0,
    },
    {
      key: "product",
      label: "Ajouter un premier produit",
      description: "Un produit publié ou en brouillon suffit pour démarrer.",
      href: `/${locale}/app/products/new`,
      manual: false,
      done: productCount > 0,
    },
    {
      key: "payments",
      label: "Vérifier les moyens de paiement",
      description: "Mobile Money, carte et paiement à la livraison.",
      href: `/${locale}/app/settings/checkout`,
      manual: true,
      done: done("payments"),
    },
    {
      key: "delivery",
      label: "Configurer la livraison",
      description: "Frais fixes ou zones Pashove Delivery.",
      href: `/${locale}/app/settings/shipping`,
      manual: true,
      done: done("delivery"),
    },
    {
      key: "policies",
      label: "Publier les politiques",
      description: "Retours, livraison et conditions de vente.",
      href: `/${locale}/app/settings/policies`,
      manual: false,
      done: policies.length > 0,
    },
    {
      key: "theme",
      label: "Personnaliser le thème",
      description: "Couleurs, blocs et navigation de la vitrine.",
      href: `/${locale}/app/online-store/themes`,
      manual: false,
      done: progress.has("theme") || theme.sections.length > 0,
    },
    {
      key: "domain",
      label: "Connecter un domaine",
      description: "Un domaine personnalisé pour ta boutique.",
      href: `/${locale}/app/settings/domains`,
      manual: true,
      done: done("domain"),
    },
    {
      key: "kyc",
      label: "Vérifier ton identité",
      description: "Obligatoire avant le premier retrait.",
      href: `/${locale}/app/finance/kyc`,
      manual: false,
      done: kyc,
    },
    {
      key: "payout_method",
      label: "Ajouter une méthode de retrait",
      description: "Le compte qui recevra tes paiements.",
      href: `/${locale}/app/finance/methods`,
      manual: false,
      done: payoutMethods > 0,
    },
    {
      key: "team",
      label: "Inviter ton équipe",
      description: "Un collaborateur peut gérer les commandes.",
      href: `/${locale}/app/settings/users`,
      manual: false,
      done: members > 1,
    },
    {
      key: "notifications",
      label: "Activer les notifications",
      description: "Commandes, retraits et vérifications.",
      href: `/${locale}/app/notifications`,
      manual: true,
      done: done("notifications"),
    },
    {
      key: "first_order",
      label: "Recevoir une première commande",
      description: "Une commande de test suffit pour valider le parcours.",
      href: `/${locale}/app/orders`,
      manual: false,
      done: orderCount > 0,
    },
    {
      key: "launch",
      label: "Publier la boutique",
      description: "Ta vitrine devient accessible au public.",
      href: `/${locale}/onboarding/launch`,
      manual: false,
      done: store.status === "active",
    },
  ];
}
