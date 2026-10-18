import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StoreSettingsForm } from "@/components/app/store-settings-form";
import { Icon, icons } from "@/components/ui/primitives";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { publicUrl } from "@/lib/r2/media";
import { currentStore } from "@/lib/stores/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.settings.storeTitle };
}

/**
 * Réglages de la vitrine : description, contacts, logo et bannière.
 *
 * La coquille (session, onboarding, boutique) est assurée par le layout de
 * l'espace marchand ; cette page ne s'occupe que de son contenu.
 */
export default async function StoreSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);

  const logoMedia =
    store.logo && store.logo_media_id
      ? { id: store.logo_media_id, url: publicUrl(store.logo.object_key) }
      : null;

  const bannerMedia =
    store.banner && store.banner_media_id
      ? { id: store.banner_media_id, url: publicUrl(store.banner.object_key) }
      : null;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href={path(locale, "/app/settings")}
        className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-accent transition-colors hover:text-accent-soft"
      >
        <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {t.settings.backToApp}
      </Link>

      <h1 className="mt-5 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {t.settings.storeTitle}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">{t.settings.storeSubtitle}</p>

      <StoreSettingsForm
        t={t}
        locale={locale}
        store={store}
        logoMedia={logoMedia}
        bannerMedia={bannerMedia}
      />
    </div>
  );
}
