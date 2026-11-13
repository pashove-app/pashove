import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { WebhookManager } from "@/components/settings/webhook-manager";
import { resolveLocale } from "@/i18n/config";
import {
  listWebhookDeliveries,
  listWebhookEndpoints,
} from "@/lib/webhooks/queries";
import { canManageTeam, currentMembership } from "@/lib/stores/queries";

export const metadata: Metadata = {
  title: "Webhooks",
  robots: { index: false, follow: false },
};

export default async function WebhooksSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/onboarding/store`);
  if (!canManageTeam(membership.role)) redirect(`/${locale}/app/settings`);

  const [endpoints, deliveries] = await Promise.all([
    listWebhookEndpoints(membership.store.id),
    listWebhookDeliveries(membership.store.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href={`/${locale}/app/settings`} className="text-[0.8125rem] font-medium text-accent hover:text-accent-soft">
        ← Réglages
      </Link>
      <header className="mt-4">
        <h1 className="text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          Webhooks
        </h1>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
          Reçois les événements de commande sur ton système. Chaque requête est signée et réessayée en cas d’échec.
        </p>
      </header>
      <div className="mt-6">
        <WebhookManager endpoints={endpoints} deliveries={deliveries} />
      </div>
    </div>
  );
}
