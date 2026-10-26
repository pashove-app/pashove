import type { Metadata } from "next";
import { MessagesWorkspace } from "@/components/messages/chat-widget";
import { listConversations } from "@/lib/messages/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Support plateforme : les conversations des marchands, en un seul endroit. */
export default async function PlatformMessagesPage() {
  const conversations = await listConversations("platform");

  return (
    <MessagesWorkspace
      conversations={conversations}
      scope="platform"
      labels={{
        title: "Messages des marchands",
        subtitle: "Réponds aux demandes de support, boutique par boutique.",
        support: "Support marchand",
        supportHint: "Conversation avec une boutique.",
        customers: "Clients",
        customersHint: "Conversations des marchands avec leurs clients.",
        empty: "Aucune conversation",
        emptyText: "Les demandes de support des marchands apparaîtront ici.",
        startSupport: "Contacter Pashove",
        placeholder: "Écris une réponse…",
        send: "Envoyer",
        attach: "Joindre une image ou une vidéo",
        order: "Commande",
        sending: "Envoi…",
        loginRequired: "Connecte-toi pour discuter.",
        merchantSelf: "Tu gères cette boutique.",
        loginCta: "Se connecter",
        openChat: "Ouvrir la messagerie",
        closeChat: "Fermer la messagerie",
        chatTitle: "Support marchand",
        chatSubtitle: "Réponds à la boutique.",
        noMessages: "Aucun message pour l’instant.",
        you: "Toi",
        merchant: "Boutique",
        platform: "Pashove",
        customer: "Client",
        error: "Le message n’a pas pu être envoyé.",
        loading: "Chargement…",
        selectConversation: "Choisis une boutique.",
      }}
      localeTag="fr-FR"
    />
  );
}
