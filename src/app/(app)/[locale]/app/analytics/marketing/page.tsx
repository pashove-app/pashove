import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReportPanel, ReportShell, ReportStats } from "@/components/analytics/report-shell";
import { resolveLocale } from "@/i18n/config";
import { listCampaigns } from "@/lib/marketing/campaigns";
import { formatMoney } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function MarketingReportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [{ data }, campaigns] = await Promise.all([
    supabase
      .from("orders")
      .select("discount_amount, discount_code")
      .eq("store_id", store.id)
      .gte("created_at", since)
      .not("discount_code", "is", null),
    listCampaigns(store.id),
  ]);

  const rows = (data ?? []) as { discount_amount: number; discount_code: string }[];
  const discount = rows.reduce((total, row) => total + row.discount_amount, 0);
  const sent = campaigns.filter((campaign) => campaign.status === "sent");
  const recipients = sent.reduce((total, campaign) => total + campaign.sent_count, 0);
  const money = (amount: number) => formatMoney(amount, store.currency, "fr-FR");

  return (
    <ReportShell locale={locale} active="marketing" title="Marketing" subtitle="Réductions utilisées et campagnes envoyées sur 30 jours.">
      <ReportStats stats={[
        { label: "Commandes avec code", value: String(rows.length) },
        { label: "Réductions accordées", value: money(discount) },
        { label: "Campagnes envoyées", value: String(sent.length) },
        { label: "E-mails envoyés", value: String(recipients) },
      ]} />
      <ReportPanel title="Dernières campagnes">
        {campaigns.length === 0 ? (
          <p className="text-[0.8125rem] text-subtle">Aucune campagne pour l’instant.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {campaigns.slice(0, 8).map((campaign) => (
              <li key={campaign.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0 truncate text-[0.8125rem] text-fg">{campaign.subject}</span>
                <span className="shrink-0 text-[0.6875rem] text-subtle">
                  {campaign.status === "sent" ? `${campaign.sent_count} envoyés` : campaign.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ReportPanel>
    </ReportShell>
  );
}
