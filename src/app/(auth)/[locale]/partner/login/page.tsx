import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export const metadata: Metadata = {
  title: "Connexion Partenaire",
  robots: { index: false, follow: false },
};

export default async function PartnerLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return (
    <div>
      <LoginForm
        t={t}
        locale={locale}
        partner
        redirectTo="/partner/delivery"
      />
      <p className="mt-6 text-center text-[0.8125rem] text-subtle">
        Pas encore partenaire ?{" "}
        <a
          href="mailto:support@pashove.com?subject=Invitation%20partenaire%20Pashove"
          className="font-medium text-accent hover:text-accent-soft"
        >
          Écris à support@pashove.com
        </a>
      </p>
    </div>
  );
}
