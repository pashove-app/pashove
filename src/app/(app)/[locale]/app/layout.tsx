import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireSecondFactor } from "@/lib/auth/mfa";
import { currentOnboardingStep, onboardingPath } from "@/lib/onboarding/steps";
import { readProfile } from "@/lib/profile/queries";
import { currentStore } from "@/lib/stores/queries";
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

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const profile = await readProfile();
  const t = await getDictionary(locale);

  return (
    <DashboardShell
      t={t}
      locale={locale}
      merchant={{
        name: profile?.full_name?.trim() || user.email || "Pashove",
        storeName: store.name,
      }}
    >
      {children}
    </DashboardShell>
  );
}
