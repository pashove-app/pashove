import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireSecondFactor } from "@/lib/auth/mfa";
import { currentOnboardingStep, onboardingPath } from "@/lib/onboarding/steps";
import { readProfile } from "@/lib/profile/queries";
import {
  ACTIVE_STORE_COOKIE,
  listStoreMemberships,
} from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Coquille de l'espace marchand.
 *
 * Les contrôles communs vivent ici, une seule fois : session, second facteur,
 * onboarding terminé, boutique existante. Chaque section n'a plus qu'à rendre
 * son contenu — avec dix écrans, répéter ces gardes serait intenable.
 */
export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  if (!isSupabaseConfigured()) redirect(`/${locale}/auth/login`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  await requireSecondFactor(locale, user);

  const step = await currentOnboardingStep();
  if (step !== "done") redirect(onboardingPath(locale, step));

  const memberships = await listStoreMemberships();
  if (memberships.length === 0) redirect(`/${locale}/onboarding/store`);

  const jar = await cookies();
  const activeStoreId = jar.get(ACTIVE_STORE_COOKIE)?.value;
  const membership =
    memberships.find((entry) => entry.store.id === activeStoreId) ??
    memberships[0];

  const { data: platformAdmin } = await supabase
    .from("platform_admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = await readProfile();
  const t = await getDictionary(locale);

  // Le repli de la sidebar est un choix d'affichage, pas une donnée métier :
  // un cookie suffit, et le serveur le connaît dès le premier rendu — donc pas
  // de saut visuel à l'hydratation.
  const collapsed = jar.get("pashove-sidebar")?.value === "1";

  const stores = memberships.map((entry) => ({
    id: entry.store.id,
    name: entry.store.name,
    slug: entry.store.slug,
    role: entry.role,
  }));

  return (
    <DashboardShell
      t={t}
      locale={locale}
      merchant={{ name: profile?.full_name?.trim() || user.email || "Pashove" }}
      defaultCollapsed={collapsed}
      isSuperAdmin={platformAdmin?.role === "super_admin"}
      stores={stores}
      activeStoreId={membership.store.id}
    >
      {children}
    </DashboardShell>
  );
}
