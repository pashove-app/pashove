import type { EmailLocale, EmailTemplate } from "./types";

type TemplateCopy = {
  subject: string;
  eyebrow: string;
  title: string;
  lead: string;
  cta?: string;
};

export type EmailCopy = {
  common: {
    orderLabel: string;
    totalLabel: string;
    subtotalLabel: string;
    discountLabel: string;
    shippingLabel: string;
    trackingLabel: string;
    itemsLabel: string;
    addressLabel: string;
    paymentLabel: string;
    emailLabel: string;
    amountLabel: string;
    dateLabel: string;
    referenceLabel: string;
    reasonLabel: string;
    roleLabel: string;
    serviceLabel: string;
    giftFor: string;
    giftMessage: string;
    giftScheduled: string;
    giftItems: string;
    footerNote: string;
    questions: string;
    plainIntro: string;
  };
  templates: Record<EmailTemplate, TemplateCopy>;
};

const fr: EmailCopy = {
  common: {
    orderLabel: "Commande",
    totalLabel: "Total",
    subtotalLabel: "Sous-total",
    discountLabel: "Remise",
    shippingLabel: "Livraison",
    trackingLabel: "Suivi",
    itemsLabel: "Articles",
    addressLabel: "Adresse",
    paymentLabel: "Paiement",
    emailLabel: "E-mail",
    amountLabel: "Montant",
    dateLabel: "Date",
    referenceLabel: "Référence",
    reasonLabel: "Motif",
    roleLabel: "Rôle",
    serviceLabel: "Prestation",
    giftFor: "Cadeau pour",
    giftMessage: "Message",
    giftScheduled: "Envoi prévu",
    giftItems: "Le cadeau",
    footerNote: "Cet e-mail t’a été envoyé par Pashove pour le compte de {store}.",
    questions: "Une question ? Réponds directement à cet e-mail.",
    plainIntro:
      "Si tu ne peux pas cliquer sur le bouton, copie ce lien dans ton navigateur :",
  },
  templates: {
    welcome: {
      subject: "Bienvenue sur Pashove",
      eyebrow: "Compte créé",
      title: "Ton compte est prêt",
      lead: "Ton compte est prêt. Crée ta boutique, ajoute ton premier produit et commence à vendre en quelques minutes.",
      cta: "Ouvrir mon espace",
    },
    order_confirmation: {
      subject: "Commande #{number} confirmée — {store}",
      eyebrow: "Commande confirmée",
      title: "Merci pour ta commande",
      lead: "Nous avons bien reçu ta commande #{number}. {store} te contactera si nécessaire.",
      cta: "Voir ma commande",
    },
    new_order: {
      subject: "Nouvelle commande #{number} — {amount}",
      eyebrow: "Nouvelle commande",
      title: "Nouvelle commande #{number}",
      lead: "{customer} vient de commander sur {store}. Prépare la commande depuis ton espace.",
      cta: "Ouvrir la commande",
    },
    order_shipped: {
      subject: "Commande #{number} expédiée",
      eyebrow: "Expédition",
      title: "Ta commande est en route",
      lead: "La commande #{number} a été expédiée par {store}.",
      cta: "Suivre ma commande",
    },
    order_delivered: {
      subject: "Commande #{number} livrée",
      eyebrow: "Livraison",
      title: "Ta commande est arrivée",
      lead: "La commande #{number} a été livrée. Merci de ta confiance !",
      cta: "Voir ma commande",
    },
    order_cancelled: {
      subject: "Commande #{number} annulée",
      eyebrow: "Annulation",
      title: "Commande annulée",
      lead: "La commande #{number} chez {store} a été annulée. Si un paiement a été encaissé, il sera remboursé.",
      cta: "Voir la commande",
    },
    order_refunded: {
      subject: "Commande #{number} remboursée",
      eyebrow: "Remboursement",
      title: "Remboursement effectué",
      lead: "La commande #{number} a été remboursée. Le délai d’apparition dépend de ton moyen de paiement.",
      cta: "Voir la commande",
    },
    digital_access: {
      subject: "Tes fichiers sont prêts — {store}",
      eyebrow: "Accès immédiat",
      title: "Tes fichiers sont disponibles",
      lead: "Le paiement de la commande #{number} est confirmé. Tu peux télécharger tes fichiers dès maintenant depuis ton espace.",
      cta: "Télécharger mes fichiers",
    },
    booking_confirmation: {
      subject: "Rendez-vous confirmé — {store}",
      eyebrow: "Rendez-vous",
      title: "Ton rendez-vous est confirmé",
      lead: "Ta réservation pour {service} est enregistrée. Retrouve les détails dans ta commande #{number}.",
      cta: "Voir mon rendez-vous",
    },
    team_invitation: {
      subject: "{inviter} t’invite à rejoindre {store}",
      eyebrow: "Invitation",
      title: "Rejoins {store} sur Pashove",
      lead: "{inviter} t’invite à collaborer sur la boutique {store}. Ce lien expire dans 7 jours.",
      cta: "Accepter l’invitation",
    },
    kyc_approved: {
      subject: "Vérification approuvée — {store}",
      eyebrow: "Vérification d’identité",
      title: "Ton identité est vérifiée",
      lead: "Ton dossier a été approuvé. Tu peux demander un retrait dès que ton solde est disponible.",
      cta: "Ouvrir ma finance",
    },
    kyc_rejected: {
      subject: "Vérification à refaire — {store}",
      eyebrow: "Vérification d’identité",
      title: "Ton dossier doit être corrigé",
      lead: "Nous n’avons pas pu valider ton dossier. Corrige les points indiqués puis renvoie-le.",
      cta: "Reprendre la vérification",
    },
    payout_requested: {
      subject: "Demande de retrait reçue — {amount}",
      eyebrow: "Retrait",
      title: "Ta demande de retrait est enregistrée",
      lead: "Nous avons reçu ta demande de retrait de {amount}. Elle sera traitée après vérification.",
      cta: "Suivre mon retrait",
    },
    payout_processed: {
      subject: "Retrait {status} — {amount}",
      eyebrow: "Retrait",
      title: "Retrait {status}",
      lead: "Ta demande de retrait de {amount} est {status}. Consulte ta finance pour le détail.",
      cta: "Voir mes retraits",
    },
    campaign: {
      subject: "{campaignSubject}",
      eyebrow: "Message de {store}",
      title: "{campaignSubject}",
      lead: "",
      cta: "Voir la boutique",
    },
    abandoned_cart: {
      subject: "Ton panier t’attend — {store}",
      eyebrow: "Panier abandonné",
      title: "Tu as oublié quelque chose ?",
      lead: "Ton panier chez {store} est toujours là. Reprends-le quand tu veux.",
      cta: "Reprendre mon panier",
    },
    contact_message: {
      subject: "Nouveau message de {contact} — {store}",
      eyebrow: "Message client",
      title: "Nouveau message",
      lead: "{contact} t’a écrit depuis {store}.",
      cta: "Répondre",
    },
    gift_received: {
      subject: "{buyer} t’a offert un cadeau — {store}",
      eyebrow: "Un cadeau pour toi",
      title: "Un cadeau t’attend",
      lead: "{buyer} t’a offert un cadeau sur {store}. Ouvre-le quand tu veux.",
      cta: "Découvrir mon cadeau",
    },
    gift_claimed: {
      subject: "Ton cadeau a été réclamé — {store}",
      eyebrow: "Cadeau réclamé",
      title: "Ton cadeau est arrivé",
      lead: "{recipient} a bien réclamé le cadeau. Aucun fichier n’est joint à cet e-mail.",
      cta: "Voir ma commande",
    },
  },
};

const en: EmailCopy = {
  common: {
    orderLabel: "Order",
    totalLabel: "Total",
    subtotalLabel: "Subtotal",
    discountLabel: "Discount",
    shippingLabel: "Shipping",
    trackingLabel: "Tracking",
    itemsLabel: "Items",
    addressLabel: "Address",
    paymentLabel: "Payment",
    emailLabel: "Email",
    amountLabel: "Amount",
    dateLabel: "Date",
    referenceLabel: "Reference",
    reasonLabel: "Reason",
    roleLabel: "Role",
    serviceLabel: "Service",
    giftFor: "Gift for",
    giftMessage: "Message",
    giftScheduled: "Scheduled for",
    giftItems: "The gift",
    footerNote: "This email was sent by Pashove on behalf of {store}.",
    questions: "Questions? Just reply to this email.",
    plainIntro:
      "If you cannot click the button, copy this link into your browser:",
  },
  templates: {
    welcome: {
      subject: "Welcome to Pashove",
      eyebrow: "Account created",
      title: "Your account is ready",
      lead: "Your account is ready. Create your store, add your first product and start selling in minutes.",
      cta: "Open my dashboard",
    },
    order_confirmation: {
      subject: "Order #{number} confirmed — {store}",
      eyebrow: "Order confirmed",
      title: "Thank you for your order",
      lead: "We received your order #{number}. {store} will contact you if needed.",
      cta: "View my order",
    },
    new_order: {
      subject: "New order #{number} — {amount}",
      eyebrow: "New order",
      title: "New order #{number}",
      lead: "{customer} just ordered from {store}. Prepare the order from your dashboard.",
      cta: "Open the order",
    },
    order_shipped: {
      subject: "Order #{number} shipped",
      eyebrow: "Shipping",
      title: "Your order is on its way",
      lead: "Order #{number} has been shipped by {store}.",
      cta: "Track my order",
    },
    order_delivered: {
      subject: "Order #{number} delivered",
      eyebrow: "Delivery",
      title: "Your order has arrived",
      lead: "Order #{number} has been delivered. Thank you for your trust!",
      cta: "View my order",
    },
    order_cancelled: {
      subject: "Order #{number} cancelled",
      eyebrow: "Cancellation",
      title: "Order cancelled",
      lead: "Order #{number} from {store} has been cancelled. Any payment received will be refunded.",
      cta: "View the order",
    },
    order_refunded: {
      subject: "Order #{number} refunded",
      eyebrow: "Refund",
      title: "Refund completed",
      lead: "Order #{number} has been refunded. Processing time depends on your payment method.",
      cta: "View the order",
    },
    digital_access: {
      subject: "Your files are ready — {store}",
      eyebrow: "Instant access",
      title: "Your files are available",
      lead: "Payment for order #{number} is confirmed. Download your files now from your account.",
      cta: "Download my files",
    },
    booking_confirmation: {
      subject: "Booking confirmed — {store}",
      eyebrow: "Booking",
      title: "Your booking is confirmed",
      lead: "Your booking for {service} is saved. Find the details in order #{number}.",
      cta: "View my booking",
    },
    team_invitation: {
      subject: "{inviter} invited you to join {store}",
      eyebrow: "Invitation",
      title: "Join {store} on Pashove",
      lead: "{inviter} invited you to collaborate on the {store} store. This link expires in 7 days.",
      cta: "Accept the invitation",
    },
    kyc_approved: {
      subject: "Verification approved — {store}",
      eyebrow: "Identity verification",
      title: "Your identity is verified",
      lead: "Your file was approved. You can request a payout as soon as your balance is available.",
      cta: "Open my finance",
    },
    kyc_rejected: {
      subject: "Verification needs another try — {store}",
      eyebrow: "Identity verification",
      title: "Your file needs a correction",
      lead: "We could not validate your file. Fix the points below and submit it again.",
      cta: "Resume verification",
    },
    payout_requested: {
      subject: "Payout request received — {amount}",
      eyebrow: "Payout",
      title: "Your payout request is saved",
      lead: "We received your payout request for {amount}. It will be processed after review.",
      cta: "Track my payout",
    },
    payout_processed: {
      subject: "Payout {status} — {amount}",
      eyebrow: "Payout",
      title: "Payout {status}",
      lead: "Your payout request for {amount} is {status}. See your finance page for details.",
      cta: "View my payouts",
    },
    campaign: {
      subject: "{campaignSubject}",
      eyebrow: "Message from {store}",
      title: "{campaignSubject}",
      lead: "",
      cta: "View the store",
    },
    abandoned_cart: {
      subject: "Your cart is waiting — {store}",
      eyebrow: "Abandoned cart",
      title: "Did you forget something?",
      lead: "Your cart at {store} is still saved. Pick it up whenever you like.",
      cta: "Resume my cart",
    },
    contact_message: {
      subject: "New message from {contact} — {store}",
      eyebrow: "Customer message",
      title: "New message",
      lead: "{contact} wrote to you from {store}.",
      cta: "Reply",
    },
    gift_received: {
      subject: "{buyer} sent you a gift — {store}",
      eyebrow: "A gift for you",
      title: "A gift is waiting for you",
      lead: "{buyer} sent you a gift from {store}. Open it whenever you like.",
      cta: "Discover my gift",
    },
    gift_claimed: {
      subject: "Your gift was claimed — {store}",
      eyebrow: "Gift claimed",
      title: "Your gift has arrived",
      lead: "{recipient} claimed the gift. No file is attached to this email.",
      cta: "View my order",
    },
  },
};

export const EMAIL_COPY: Record<EmailLocale, EmailCopy> = { fr, en };
