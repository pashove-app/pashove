import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessagesWorkspace } from "@/components/messages/chat-widget";
import { LOCALE_META, resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { listConversations, openSupportChat } from "@/lib/messages/queries";
import { currentMembership } from "@/lib/stores/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Boîte de réception : support Pashove et conversations clients. */
export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const membership = await currentMembership();
  if (!membership) redirect(`/${locale}/onboarding/store`);

  // Ouvre (ou retrouve) le fil de support de la boutique.
  await openSupportChat(membership.store.id);

  const [conversations, t] = await Promise.all([
    listConversations("merchant"),
    getDictionary(locale),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={`/${locale}/app/support/tickets`}
          className="inline-flex h-9 items-center rounded-full bg-brand-500 px-4 text-[0.75rem] font-medium text-white hover:bg-brand-600"
        >
          Tickets support
        </Link>
        <Link
          href={`/${locale}/app/support/kb`}
          className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-[0.75rem] font-medium text-body hover:border-border-strong"
        >
          Centre d’aide
        </Link>
      </div>

      <MessagesWorkspace
        conversations={conversations}
        scope="merchant"
        storeId={membership.store.id}
        labels={t.messages}
        localeTag={LOCALE_META[locale].tag}
      />
    </div>
  );
}
