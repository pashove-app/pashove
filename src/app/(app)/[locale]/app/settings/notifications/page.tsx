import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  NotificationPreferences,
  type NotificationItem,
} from "@/components/app/notification-preferences";
import { BackLink } from "@/components/ui/back-link";
import { path } from "@/components/ui/types";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { EMAIL_KINDS } from "@/lib/email/types";
import type { EmailKind } from "@/lib/email/types";
import { currentStore } from "@/lib/stores/queries";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const t = await getDictionary(locale);

  return { title: t.dashboard.settings.notifications.title };
}

/** Choix des alertes e-mail reçues par le marchand. */
export default async function NotificationSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const t = await getDictionary(locale);
  const labels = t.dashboard.settings.notifications;

  const supabase = await createClient();
  const { data } = await supabase
    .from("store_email_preferences")
    .select("kind, enabled")
    .eq("store_id", store.id);

  const saved = new Map(
    ((data ?? []) as { kind: EmailKind; enabled: boolean }[]).map((row) => [
      row.kind,
      row.enabled,
    ]),
  );

  const copy: Record<EmailKind, { title: string; text: string }> = {
    new_order: { title: labels.newOrder, text: labels.newOrderText },
    order_cancelled: {
      title: labels.cancellations,
      text: labels.cancellationsText,
    },
    kyc: { title: labels.kyc, text: labels.kycText },
    payout: { title: labels.payouts, text: labels.payoutsText },
  };

  const items: NotificationItem[] = EMAIL_KINDS.map((kind) => ({
    kind,
    title: copy[kind].title,
    text: copy[kind].text,
    enabled: saved.get(kind) !== false,
  }));

  return (
    <div className="mx-auto w-full max-w-2xl">
      <BackLink href={path(locale, "/app/settings")} label={t.dashboard.settings.title} />

      <h1 className="mt-5 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
        {labels.title}
      </h1>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
        {labels.subtitle}
      </p>

      <p className="mt-4 rounded-2xl border border-border bg-hairline px-4 py-3 text-[0.8125rem] leading-relaxed text-subtle">
        {store.contact_email
          ? labels.deliveryNote.replace("{email}", store.contact_email)
          : labels.deliveryMissing}
      </p>

      <NotificationPreferences
        locale={locale}
        items={items}
        labels={{
          save: labels.save,
          saving: labels.saving,
          saved: labels.saved,
          error: labels.error,
        }}
      />
    </div>
  );
}
