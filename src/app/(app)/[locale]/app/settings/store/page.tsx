import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MerchantHeader } from "@/components/app/merchant-header";
import { StoreSettingsForm } from "@/components/app/store-settings-form";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireSecondFactor } from "@/lib/auth/mfa";
import { currentOnboardingStep, onboardingPath } from "@/lib/onboarding/steps";
import { currentStore } from "@/lib/stores/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return {
    title: t.settings.storeTitle,
    robots: { index: false, follow: false },
  };
}

/**
 * Réglages de la vitrine.
 *
 * Un marchand encore en onboarding n'a rien à régler ici : il est renvoyé vers
 * l'étape qui lui manque. Une boutique suspendue, elle, garde accès à ses
 * réglages.
 */
export default async function StoreSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

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

  const t = await getDictionary(locale);

  return (
    <div className="min-h-dvh bg-bg">
      <MerchantHeader t={t} locale={locale} />

      <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8">
        <Link
          href={path(locale, "/app")}
          className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-soft"
        >
          <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
          {t.settings.backToApp}
        </Link>

        <h1 className="mt-5 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {t.settings.storeTitle}
        </h1>
        <p className="mt-2 text-[0.9375rem] text-muted">{t.settings.storeSubtitle}</p>

        <StoreSettingsForm t={t} locale={locale} store={store} />
      </main>
    </div>
  );
}
