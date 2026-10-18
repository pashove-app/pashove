import { UnderConstruction } from "@/components/dashboard/under-construction";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/** Section à venir. */
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return (
    <UnderConstruction
      t={t}
      locale={locale}
      section={t.dashboard.nav.customers}
      icon="users"
    />
  );
}
