import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
