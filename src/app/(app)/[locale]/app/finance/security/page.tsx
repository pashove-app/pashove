import { BackLink } from "@/components/ui/back-link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PayoutPinForm } from "@/components/finance/payout-pin-form";
import { TwoFactorCard } from "@/components/finance/two-factor-card";
import { path } from "@/components/ui/types";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { hasVerifiedTotp } from "@/lib/auth/mfa";
import { getPayoutSecurity } from "@/lib/finance/queries";
import { currentStore } from "@/lib/stores/queries";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.finance.securityTitle };
}

/** PIN de retrait et état de la double authentification. */
export default async function PayoutSecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [security, t] = await Promise.all([
    getPayoutSecurity(store.id),
    getDictionary(locale),
  ]);

  const labels = t.dashboard.finance;
  const twoFactor = hasVerifiedTotp(user);

  const lockedUntilLabel = security.lockedUntil
    ? new Intl.DateTimeFormat(LOCALE_META[locale].tag, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(security.lockedUntil))
    : null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href={path(locale, "/app/finance")} label={labels.backToFinance} />

      <div className="mt-5">
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          {labels.securityTitle}
        </h1>
        <p className="mt-1.5 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
          {labels.securitySubtitle}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <PayoutPinForm
          t={t}
          hasPin={security.hasPin}
          lockedUntilLabel={lockedUntilLabel}
        />

        <TwoFactorCard t={t} locale={locale} enabled={twoFactor} />
      </div>
    </div>
  );
}
