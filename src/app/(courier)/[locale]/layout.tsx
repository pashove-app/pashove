import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { isLocale, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { signOutAction } from "@/lib/auth/actions";
import { requireSecondFactor } from "@/lib/auth/mfa";
import { readProfile } from "@/lib/profile/queries";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "fr";

  return {
    title: "Pashove Delivery",
    robots: { index: false, follow: false },
    manifest: `/${locale}/app/courier/manifest.webmanifest`,
    icons: { apple: "/pwa/apple-touch-icon.png" },
    appleWebApp: {
      capable: true,
      title: "Pashove Delivery",
      statusBarStyle: "black-translucent",
    },
  };
}

/**
 * Coquille de l'espace livreur.
 *
 * Volontairement séparée de l'espace marchand : un livreur n'a ni boutique à
 * configurer ni onboarding à terminer. Seules la session et le second facteur
 * sont exigés — exactement ce qu'il faut pour toucher à ses courses.
 */
export default async function CourierLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const locale = resolveLocale(raw);
  const login = `/${locale}/auth/login?redirect=/app/courier`;

  if (!isSupabaseConfigured()) redirect(login);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(login);

  await requireSecondFactor(locale, user);

  const profile = await readProfile();
  const t = await getDictionary(locale);
  const name = profile?.full_name?.trim() || user.email || "";

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 text-[0.9375rem] font-semibold tracking-[-0.02em] text-fg"
          >
            Pashove
            <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-accent">
              Delivery
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden max-w-[10rem] truncate text-[0.75rem] text-muted sm:block">
              {name}
            </span>
            <form action={signOutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="text-[0.75rem] font-medium text-subtle transition-colors hover:text-fg"
              >
                {t.customer.logout}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
