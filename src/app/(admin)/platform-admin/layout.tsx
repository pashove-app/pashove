import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, icons } from "@/components/ui/primitives";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pashove · Administration",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/platform-admin", label: "Vue d’ensemble", icon: icons.chart },
  { href: "/platform-admin/merchants", label: "Marchands", icon: icons.users },
  { href: "/platform-admin/stores", label: "Boutiques", icon: icons.store },
  { href: "/platform-admin/users", label: "Utilisateurs", icon: icons.user },
  { href: "/platform-admin/kyc", label: "KYC", icon: icons.shield },
  { href: "/platform-admin/couriers", label: "Livreurs", icon: icons.route },
  { href: "/platform-admin/deliveries", label: "Livraisons", icon: icons.box },
  { href: "/platform-admin/delivery-pricing", label: "Tarifs livraison", icon: icons.wallet },
  { href: "/platform-admin/payouts", label: "Retraits", icon: icons.wallet },
  { href: "/platform-admin/payments", label: "Paiements", icon: icons.wallet },
  { href: "/platform-admin/payment-providers", label: "Fournisseurs", icon: icons.code },
  { href: "/platform-admin/emails", label: "E-mails", icon: icons.mail },
  { href: "/platform-admin/settings", label: "Réglages", icon: icons.settings },
  { href: "/platform-admin/reconciliation", label: "Réconciliation", icon: icons.chart },
  { href: "/platform-admin/audit", label: "Audit", icon: icons.list },
  { href: "/platform-admin/messages", label: "Messages", icon: icons.chat },
];

/** Coquille interne de l'administration plateforme. */
export default async function PlatformAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!isSupabaseConfigured()) redirect("/fr/auth/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/fr/auth/login");

  const { data: admin } = await supabase
    .from("platform_admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) notFound();

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white">
              <Icon path={icons.shield} className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[0.875rem] font-semibold text-fg">
                Pashove · Administration
              </p>
              <p className="text-[0.6875rem] text-faint">
                {(admin.role as string).replace("_", " ")}
              </p>
            </div>
          </div>

          <Link
            href="/fr/app"
            className="text-[0.75rem] font-medium text-subtle transition-colors hover:text-fg"
          >
            Espace marchand
          </Link>
        </div>

        <nav className="mx-auto flex w-full max-w-6xl flex-wrap gap-2 px-4 pb-3 sm:px-8">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border px-4 text-[0.75rem] font-medium text-subtle transition-colors hover:border-border-strong hover:text-fg"
            >
              <Icon path={item.icon} className="h-3.5 w-3.5" strokeWidth={1.8} />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
        {children}
      </main>
    </div>
  );
}
