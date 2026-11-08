import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  COURIER_HOME,
  courierIntent,
  safeAppPath,
} from "@/lib/auth/redirects";

type Search = { redirect?: string; role?: string };

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { redirect, role } = await searchParams;
  if (courierIntent({ redirect, role })) {
    return { title: "Créer un compte livreur · Pashove Delivery" };
  }

  const t = await getDictionary(locale);
  return { title: t.auth.registerTitle };
}

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  const { redirect, role } = await searchParams;
  const courier = courierIntent({ redirect, role });
  const redirectTo = courier ? COURIER_HOME : safeAppPath(redirect);

  return (
    <RegisterForm
      t={t}
      locale={locale}
      courier={courier}
      redirectTo={redirectTo}
    />
  );
}
