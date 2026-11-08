import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DomainSettings } from "@/components/app/domain-settings";
import { BackLink } from "@/components/ui/back-link";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getStoreDomain } from "@/lib/domains/queries";
import {
  isReservedSubdomain,
  pashoveStoreHost,
} from "@/lib/domains/hosts";
import { isDomainsConfigured } from "@/lib/domains/vercel";
import { currentMembership } from "@/lib/stores/queries";

const COPY = {
  fr: {
    title: "Domaine",
    subtitle:
      "Ton adresse Pashove est incluse. Connecte aussi ton propre nom de domaine pour vendre sous ta marque.",
    back: "Retour aux réglages",
    checked:
      "Vérification effectuée. Le statut ci-dessous reflète la configuration DNS au moment du contrôle.",
    removed:
      "Domaine supprimé. La vitrine reste accessible sur ton adresse Pashove.",
  },
  en: {
    title: "Domain",
    subtitle:
      "Your Pashove address is included. Connect your own domain name to sell under your brand too.",
    back: "Back to settings",
    checked:
      "Check completed. The status below reflects the DNS configuration at the time of the check.",
    removed:
      "Domain removed. Your storefront remains available on your Pashove address.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);
  const copy = locale === "en" ? COPY.en : COPY.fr;

  return { title: `${t.dashboard.settings.title} · ${copy.title}` };
}

export default async function DomainSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ checked?: string; removed?: string; error?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const copy = locale === "en" ? COPY.en : COPY.fr;
  const { checked, removed, error } = await searchParams;

  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/onboarding/store`);

  const domain = await getStoreDomain(membership.store.id);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink
        href={path(locale, "/app/settings")}
        label={copy.back}
      />

      <h1 className="mt-5 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {copy.title}
      </h1>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
        {copy.subtitle}
      </p>

      {checked ? (
        <p className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-3 text-[0.8125rem] text-emerald-700 dark:text-emerald-300">
          {copy.checked}
        </p>
      ) : null}

      {removed ? (
        <p className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-3 text-[0.8125rem] text-emerald-700 dark:text-emerald-300">
          {copy.removed}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3.5 py-3 text-[0.8125rem] leading-relaxed text-red-600 dark:text-red-400"
        >
          {decodeURIComponent(error)}
        </p>
      ) : null}

      <DomainSettings
        locale={locale}
        freeHost={pashoveStoreHost(membership.store.slug)}
        storeSlug={membership.store.slug}
        domain={domain}
        owner={membership.role === "owner"}
        configured={isDomainsConfigured()}
        reservedSubdomain={isReservedSubdomain(membership.store.slug)}
      />
    </div>
  );
}
