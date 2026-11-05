import type { Locale } from "@/i18n/config";

/**
 * Textes du module cadeau.
 *
 * FR et EN sont complets ; BM, LN et AR retombent sur le français pour ce lot,
 * comme les e-mails. Les chaînes seront traduites lors d'un lot de langue.
 */
export type GiftCopy = {
  checkout: {
    title: string;
    text: string;
    toggle: string;
    recipientName: string;
    recipientEmail: string;
    message: string;
    messageHint: string;
    date: string;
    dateHint: string;
    info: string;
    multipleServices: string;
    disabled: string;
    required: string;
  };
  claim: {
    eyebrow: string;
    giftFrom: string;
    forYou: string;
    messageTitle: string;
    order: string;
    scheduled: string;
    availableNow: string;
    expiredTitle: string;
    expiredText: string;
    cancelledTitle: string;
    cancelledText: string;
    notReadyTitle: string;
    notReadyText: string;
    createAccount: string;
    createAccountHint: string;
    guest: string;
    guestHint: string;
    claim: string;
    claiming: string;
    accountCta: string;
    physicalTitle: string;
    physicalText: string;
    fullName: string;
    phone: string;
    country: string;
    city: string;
    address: string;
    extra: string;
    serviceTitle: string;
    serviceText: string;
    slot: string;
    noSlots: string;
    required: string;
    errorGeneric: string;
    errorExpired: string;
    errorNotReady: string;
    errorSlotTaken: string;
  };
  success: {
    title: string;
    text: string;
    download: string;
    downloading: string;
    downloadsTitle: string;
    noDownload: string;
    backToStore: string;
    claimedBy: string;
    addressTitle: string;
    serviceTitle: string;
    seeAccount: string;
  };
  merchant: {
    title: string;
    subtitle: string;
    tabSent: string;
    tabReceived: string;
    tabSettings: string;
    emptySent: string;
    emptyReceived: string;
    sentFor: string;
    buyer: string;
    recipient: string;
    scheduled: string;
    claimed: string;
    pending: string;
    expired: string;
    cancelled: string;
    openLink: string;
    settingsTitle: string;
    settingsText: string;
    settingsToggle: string;
    settingsHint: string;
    save: string;
    saving: string;
    saved: string;
    error: string;
    noItems: string;
  };
};

const fr: GiftCopy = {
  checkout: {
    title: "Acheter comme cadeau",
    text: "Envoie ce produit directement à quelqu’un, avec un message et une date d’envoi.",
    toggle: "C’est un cadeau",
    recipientName: "Prénom et nom du destinataire",
    recipientEmail: "E-mail du destinataire",
    message: "Message personnalisé",
    messageHint: "Joyeux anniversaire !",
    date: "Date d’envoi",
    dateHint: "Laisse vide pour envoyer immédiatement.",
    info: "Le produit sera envoyé directement au destinataire à la date choisie.",
    multipleServices: "Un cadeau ne peut contenir qu’un seul service à la fois.",
    disabled: "Les cadeaux ne sont pas activés pour cette boutique.",
    required: "Complète les champs du cadeau.",
  },
  claim: {
    eyebrow: "Un cadeau pour toi",
    giftFrom: "{buyer} t’a offert un cadeau",
    forYou: "Pour {recipient}",
    messageTitle: "Son message",
    order: "Commande",
    scheduled: "Envoi prévu le {date}",
    availableNow: "Ton cadeau est prêt à être réclamé.",
    expiredTitle: "Ce cadeau a expiré",
    expiredText: "Les cadeaux peuvent être réclamés pendant 90 jours. Contacte la boutique si tu penses qu’il s’agit d’une erreur.",
    cancelledTitle: "Ce cadeau n’est plus disponible",
    cancelledText: "La commande a été annulée ou remboursée. Contacte la boutique pour en savoir plus.",
    notReadyTitle: "Ton cadeau arrive bientôt",
    notReadyText: "Reviens à partir du {date} pour le réclamer.",
    createAccount: "Créer un compte",
    createAccountHint: "Recommandé : retrouve ton cadeau et tes commandes à tout moment.",
    guest: "Continuer en invité",
    guestHint: "Tu pourras réclamer ton cadeau sans créer de compte.",
    claim: "Réclamer mon cadeau",
    claiming: "Réclamation…",
    accountCta: "Créer un compte pour suivre mon cadeau",
    physicalTitle: "Où livrer ton cadeau ?",
    physicalText: "Indique l’adresse à laquelle tu souhaites recevoir ce produit.",
    fullName: "Nom complet",
    phone: "Téléphone",
    country: "Pays",
    city: "Ville",
    address: "Adresse",
    extra: "Complément d’adresse",
    serviceTitle: "Choisis ton créneau",
    serviceText: "Sélectionne la date et l’heure de ta prestation.",
    slot: "Créneau",
    noSlots: "Aucun créneau disponible pour le moment. Contacte la boutique.",
    required: "Complète les champs obligatoires.",
    errorGeneric: "Impossible de réclamer ce cadeau. Réessaie.",
    errorExpired: "Ce cadeau a expiré.",
    errorNotReady: "Ce cadeau n’est pas encore disponible.",
    errorSlotTaken: "Ce créneau vient d’être réservé. Choisis-en un autre.",
  },
  success: {
    title: "Ton cadeau est à toi",
    text: "La réclamation est enregistrée. {store} a été prévenu.",
    download: "Télécharger",
    downloading: "Préparation…",
    downloadsTitle: "Tes fichiers",
    noDownload: "Aucun fichier à télécharger.",
    backToStore: "Retourner à la boutique",
    claimedBy: "Réclamé par {name}",
    addressTitle: "Adresse de livraison",
    serviceTitle: "Ton rendez-vous",
    seeAccount: "Voir mon compte",
  },
  merchant: {
    title: "Cadeaux",
    subtitle: "Les achats offerts par tes clients et les cadeaux que tu reçois.",
    tabSent: "Envoyés",
    tabReceived: "Reçus",
    tabSettings: "Configuration",
    emptySent: "Aucun cadeau envoyé pour le moment.",
    emptyReceived: "Aucun cadeau reçu pour le moment.",
    sentFor: "Cadeau pour {name}",
    buyer: "Acheteur",
    recipient: "Destinataire",
    scheduled: "Envoi",
    claimed: "Réclamé",
    pending: "En attente",
    expired: "Expiré",
    cancelled: "Annulé",
    openLink: "Ouvrir le lien",
    settingsTitle: "Activer les cadeaux",
    settingsText: "Permets à tes clients d’acheter un produit comme cadeau et de l’envoyer à quelqu’un.",
    settingsToggle: "Proposer l’option cadeau au checkout",
    settingsHint: "Les cadeaux déjà créés restent accessibles même si tu désactives l’option.",
    save: "Enregistrer",
    saving: "Enregistrement…",
    saved: "Configuration enregistrée.",
    error: "Impossible d’enregistrer. Réessaie.",
    noItems: "Aucun article",
  },
};

const en: GiftCopy = {
  checkout: {
    title: "Buy as a gift",
    text: "Send this product directly to someone, with a message and a delivery date.",
    toggle: "This is a gift",
    recipientName: "Recipient’s full name",
    recipientEmail: "Recipient’s email",
    message: "Personal message",
    messageHint: "Happy birthday!",
    date: "Send date",
    dateHint: "Leave empty to send immediately.",
    info: "The product will be sent directly to the recipient on the chosen date.",
    multipleServices: "A gift can only contain one service at a time.",
    disabled: "Gifts are not enabled for this store.",
    required: "Complete the gift fields.",
  },
  claim: {
    eyebrow: "A gift for you",
    giftFrom: "{buyer} sent you a gift",
    forYou: "For {recipient}",
    messageTitle: "Their message",
    order: "Order",
    scheduled: "Scheduled for {date}",
    availableNow: "Your gift is ready to claim.",
    expiredTitle: "This gift has expired",
    expiredText: "Gifts can be claimed for 90 days. Contact the store if you think this is a mistake.",
    cancelledTitle: "This gift is no longer available",
    cancelledText: "The order was cancelled or refunded. Contact the store for details.",
    notReadyTitle: "Your gift is coming soon",
    notReadyText: "Come back from {date} to claim it.",
    createAccount: "Create an account",
    createAccountHint: "Recommended: find your gift and orders anytime.",
    guest: "Continue as guest",
    guestHint: "You can claim your gift without creating an account.",
    claim: "Claim my gift",
    claiming: "Claiming…",
    accountCta: "Create an account to track my gift",
    physicalTitle: "Where should we deliver your gift?",
    physicalText: "Enter the address where you want to receive this product.",
    fullName: "Full name",
    phone: "Phone",
    country: "Country",
    city: "City",
    address: "Address",
    extra: "Address details",
    serviceTitle: "Choose your slot",
    serviceText: "Select the date and time for your service.",
    slot: "Slot",
    noSlots: "No slot available right now. Contact the store.",
    required: "Please complete the required fields.",
    errorGeneric: "Could not claim this gift. Try again.",
    errorExpired: "This gift has expired.",
    errorNotReady: "This gift is not available yet.",
    errorSlotTaken: "That slot was just booked. Choose another one.",
  },
  success: {
    title: "The gift is yours",
    text: "Your claim is saved. {store} has been notified.",
    download: "Download",
    downloading: "Preparing…",
    downloadsTitle: "Your files",
    noDownload: "No file to download.",
    backToStore: "Back to the store",
    claimedBy: "Claimed by {name}",
    addressTitle: "Delivery address",
    serviceTitle: "Your appointment",
    seeAccount: "View my account",
  },
  merchant: {
    title: "Gifts",
    subtitle: "Gifts bought by your customers and gifts you receive.",
    tabSent: "Sent",
    tabReceived: "Received",
    tabSettings: "Settings",
    emptySent: "No gift sent yet.",
    emptyReceived: "No gift received yet.",
    sentFor: "Gift for {name}",
    buyer: "Buyer",
    recipient: "Recipient",
    scheduled: "Send",
    claimed: "Claimed",
    pending: "Pending",
    expired: "Expired",
    cancelled: "Cancelled",
    openLink: "Open link",
    settingsTitle: "Enable gifts",
    settingsText: "Let customers buy a product as a gift and send it to someone.",
    settingsToggle: "Offer the gift option at checkout",
    settingsHint: "Gifts already created stay accessible even if you disable the option.",
    save: "Save",
    saving: "Saving…",
    saved: "Settings saved.",
    error: "Could not save. Try again.",
    noItems: "No items",
  },
};

const COPY: Record<"fr" | "en", GiftCopy> = { fr, en };

export function getGiftCopy(locale: Locale | string): GiftCopy {
  return locale === "en" ? COPY.en : COPY.fr;
}
