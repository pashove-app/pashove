import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ApiKeyManager } from "@/components/settings/api-key-manager";
import { resolveLocale } from "@/i18n/config";
import { listApiKeys } from "@/lib/api-keys/queries";
import { currentMembership, canManageTeam } from "@/lib/stores/queries";

export const metadata: Metadata = {
  title: "Clés API",
  robots: { index: false, follow: false },
};

export default async function ApiSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/onboarding/store`);
  if (!canManageTeam(membership.role)) redirect(`/${locale}/app/settings`);

  const keys = await listApiKeys(membership.store.id);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href={`/${locale}/app/settings`} className="text-[0.8125rem] font-medium text-accent hover:text-accent-soft">
        ← Réglages
      </Link>

      <header className="mt-4">
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          API et clés
        </h1>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
          Connecte un outil externe à ta boutique. Base : <code dir="ltr">/api/v1</code>. En-tête : <code dir="ltr">Authorization: Bearer pk_live_…</code>.
        </p>
      </header>

      <div className="mt-6">
        <ApiKeyManager keys={keys} />
      </div>

      <section className="mt-5 rounded-3xl border border-border bg-surface p-5">
        <h2 className="text-[0.9375rem] font-medium text-fg">Endpoints disponibles</h2>
        <ul className="mt-3 space-y-1.5 font-mono text-[0.75rem] text-subtle">
          <li>GET /api/v1/store</li>
          <li>GET /api/v1/products?limit=50&amp;status=published</li>
          <li>GET /api/v1/orders?limit=50&amp;status=paid</li>
        </ul>
      </section>
    </div>
  );
}
