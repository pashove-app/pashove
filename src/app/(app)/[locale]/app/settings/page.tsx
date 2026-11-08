import type { Metadata } from "next";
import Link from "next/link";
import { Icon, icons, type IconKey } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.settings.title };
}

/** Hub des réglages : ce qui existe aujourd'hui, et ce qui arrive. */
export default async function SettingsHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {t.dashboard.settings.title}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">
        {t.dashboard.settings.subtitle}
      </p>

      <div className="mt-8 space-y-3">
        <SettingsLink
          href={path(locale, "/app/settings/store")}
          icon="store"
          title={t.dashboard.settings.storeTitle}
          text={t.dashboard.settings.storeText}
          cta={t.dashboard.settings.storeCta}
        />

        <SettingsLink
          href={path(locale, "/app/settings/users")}
          icon="users"
          title={t.dashboard.team.title}
          text={t.dashboard.team.subtitle}
          cta={t.dashboard.team.title}
        />

        <SettingsLink
          href={path(locale, "/app/settings/plan")}
          icon="sparkle"
          title="Abonnement"
          text="Plan actuel, commission et renouvellement par Mobile Money."
          cta="Gérer mon plan"
        />

        <SettingsLink
          href={path(locale, "/app/settings/markets")}
          icon="globe"
          title="Pays de vente"
          text="Active les pays où tu acceptes des commandes."
          cta="Gérer les pays"
        />

        <SettingsLink
          href={path(locale, "/app/settings/checkout")}
          icon="card"
          title="Page de paiement"
          text="Logo, couleurs, textes et ordre des blocs du checkout."
          cta="Personnaliser"
        />

        <SettingsLink
          href={path(locale, "/app/settings/shipping")}
          icon="route"
          title="Livraison"
          text="Mode de livraison et zones desservies par Pashove Delivery."
          cta="Configurer"
        />

        <SettingsLink
          href={path(locale, "/app/settings/policies")}
          icon="file"
          title={t.dashboard.settings.policiesTitle}
          text={t.dashboard.settings.policiesText}
          cta={t.dashboard.settings.policiesCta}
        />

        <SettingsLink
          href={path(locale, "/app/settings/notifications")}
          icon="mail"
          title={t.dashboard.settings.notificationsTitle}
          text={t.dashboard.settings.notificationsText}
          cta={t.dashboard.settings.notificationsCta}
        />

        <SettingsLink
          href={path(locale, "/auth/security")}
          icon="shield"
          title={t.dashboard.settings.securityTitle}
          text={t.dashboard.settings.securityText}
          cta={t.dashboard.settings.securityCta}
        />

        <div className="rounded-2xl border border-border bg-surface/60 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[0.9375rem] font-medium text-fg">
                {t.dashboard.settings.soonTitle}
              </h2>
              <p className="mt-1.5 max-w-lg text-[0.8125rem] leading-relaxed text-subtle">
                {t.dashboard.settings.soonText}
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-border-soft bg-hairline px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-subtle">
              {t.dashboard.settings.soonBadge}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsLink({
  href,
  icon,
  title,
  text,
  cta,
}: {
  href: string;
  icon: IconKey;
  title: string;
  text: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-hairline text-accent">
        <Icon path={icons[icon]} className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-medium text-fg">{title}</span>
        <span className="mt-1 block text-[0.8125rem] leading-relaxed text-subtle">
          {text}
        </span>
        <span className="mt-2 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-accent">
          {cta}
          <Icon
            path={icons.arrowRight}
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
          />
        </span>
      </span>
    </Link>
  );
}
