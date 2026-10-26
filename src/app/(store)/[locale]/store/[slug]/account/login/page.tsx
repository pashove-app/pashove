import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomerLoginForm } from "@/components/storefront/customer-login-form";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCustomerUser } from "@/lib/customer/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CustomerLoginPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);

  const user = await getCustomerUser();
  if (user) redirect(`/${locale}/store/${slug}/account`);

  const t = await getDictionary(locale);

  return <CustomerLoginForm t={t} locale={locale} slug={slug} />;
}
