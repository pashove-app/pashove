import type { Locale } from "@/i18n/config";

export type StoreAdminCopy = {
  pages: {
    title: string;
    subtitle: string;
    newPage: string;
    editPage: string;
    titleLabel: string;
    slugLabel: string;
    bodyLabel: string;
    bodyHint: string;
    statusDraft: string;
    statusPublished: string;
    save: string;
    saving: string;
    saved: string;
    deleted: string;
    delete: string;
    edit: string;
    view: string;
    empty: string;
    cancel: string;
    required: string;
    slugTaken: string;
    error: string;
  };
  nav: {
    title: string;
    subtitle: string;
    label: string;
    href: string;
    visible: string;
    add: string;
    remove: string;
    up: string;
    down: string;
    save: string;
    saving: string;
    saved: string;
    reset: string;
    empty: string;
    hint: string;
    error: string;
  };
  blog: {
    title: string;
    subtitle: string;
    newPost: string;
    editPost: string;
    titleLabel: string;
    slugLabel: string;
    excerptLabel: string;
    bodyLabel: string;
    coverLabel: string;
    statusDraft: string;
    statusPublished: string;
    save: string;
    saving: string;
    saved: string;
    deleted: string;
    delete: string;
    edit: string;
    view: string;
    empty: string;
    cancel: string;
    error: string;
  };
  contact: {
    title: string;
    subtitle: string;
    name: string;
    email: string;
    message: string;
    send: string;
    sending: string;
    sentTitle: string;
    sentText: string;
    error: string;
    required: string;
    back: string;
  };
};

const fr: StoreAdminCopy = {
  pages: {
    title: "Pages de la boutique",
    subtitle:
      "Crée des pages À propos, FAQ, Contact ou toute autre page utile. Le contenu accepte le Markdown simple.",
    newPage: "Nouvelle page",
    editPage: "Modifier la page",
    titleLabel: "Titre",
    slugLabel: "Adresse de la page",
    bodyLabel: "Contenu",
    bodyHint: "Markdown simple : # titre, **gras**, *italique*, [lien](https://…), listes avec -.",
    statusDraft: "Brouillon",
    statusPublished: "Publiée",
    save: "Enregistrer",
    saving: "Enregistrement…",
    saved: "Page enregistrée.",
    deleted: "Page supprimée.",
    delete: "Supprimer",
    edit: "Modifier",
    view: "Voir",
    empty: "Aucune page pour le moment.",
    cancel: "Annuler",
    required: "Complète le titre et l’adresse.",
    slugTaken: "Cette adresse est déjà utilisée.",
    error: "Impossible d’enregistrer la page.",
  },
  nav: {
    title: "Navigation de la boutique",
    subtitle:
      "Choisis les liens affichés dans l’en-tête. Sans lien personnalisé, la navigation par défaut reste active.",
    label: "Libellé",
    href: "Lien",
    visible: "Visible",
    add: "Ajouter un lien",
    remove: "Retirer",
    up: "Monter",
    down: "Descendre",
    save: "Enregistrer la navigation",
    saving: "Enregistrement…",
    saved: "Navigation enregistrée.",
    reset: "Revenir à la navigation par défaut",
    empty: "Aucun lien personnalisé.",
    hint: "Utilise un chemin complet, par exemple /fr/store/ma-boutique/pages/about.",
    error: "Impossible d’enregistrer la navigation.",
  },
  blog: {
    title: "Blog",
    subtitle: "Publie des articles en Markdown pour raconter ta marque et ton actualité.",
    newPost: "Nouvel article",
    editPost: "Modifier l’article",
    titleLabel: "Titre",
    slugLabel: "Adresse de l’article",
    excerptLabel: "Résumé",
    bodyLabel: "Article",
    coverLabel: "Image de couverture (URL)",
    statusDraft: "Brouillon",
    statusPublished: "Publié",
    save: "Enregistrer",
    saving: "Enregistrement…",
    saved: "Article enregistré.",
    deleted: "Article supprimé.",
    delete: "Supprimer",
    edit: "Modifier",
    view: "Voir",
    empty: "Aucun article pour le moment.",
    cancel: "Annuler",
    error: "Impossible d’enregistrer l’article.",
  },
  contact: {
    title: "Écris à la boutique",
    subtitle: "Une question sur un produit, une commande ou une livraison ? Envoie un message.",
    name: "Ton nom",
    email: "Ton e-mail",
    message: "Ton message",
    send: "Envoyer le message",
    sending: "Envoi…",
    sentTitle: "Message envoyé",
    sentText: "La boutique te répondra à l’adresse indiquée.",
    error: "Impossible d’envoyer le message. Réessaie.",
    required: "Complète les champs obligatoires.",
    back: "Retour à la boutique",
  },
};

const en: StoreAdminCopy = {
  pages: {
    title: "Store pages",
    subtitle:
      "Create About, FAQ, Contact or any useful page. Content accepts simple Markdown.",
    newPage: "New page",
    editPage: "Edit page",
    titleLabel: "Title",
    slugLabel: "Page address",
    bodyLabel: "Content",
    bodyHint: "Simple Markdown: # title, **bold**, *italic*, [link](https://…), lists with -.",
    statusDraft: "Draft",
    statusPublished: "Published",
    save: "Save",
    saving: "Saving…",
    saved: "Page saved.",
    deleted: "Page deleted.",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    empty: "No page yet.",
    cancel: "Cancel",
    required: "Complete the title and address.",
    slugTaken: "This address is already used.",
    error: "Could not save the page.",
  },
  nav: {
    title: "Store navigation",
    subtitle:
      "Choose the links shown in the header. Without custom links, the default navigation stays active.",
    label: "Label",
    href: "Link",
    visible: "Visible",
    add: "Add a link",
    remove: "Remove",
    up: "Move up",
    down: "Move down",
    save: "Save navigation",
    saving: "Saving…",
    saved: "Navigation saved.",
    reset: "Back to default navigation",
    empty: "No custom link.",
    hint: "Use a full path, for example /en/store/my-store/pages/about.",
    error: "Could not save navigation.",
  },
  blog: {
    title: "Blog",
    subtitle: "Publish Markdown posts to tell your brand story and news.",
    newPost: "New post",
    editPost: "Edit post",
    titleLabel: "Title",
    slugLabel: "Post address",
    excerptLabel: "Excerpt",
    bodyLabel: "Post",
    coverLabel: "Cover image (URL)",
    statusDraft: "Draft",
    statusPublished: "Published",
    save: "Save",
    saving: "Saving…",
    saved: "Post saved.",
    deleted: "Post deleted.",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    empty: "No post yet.",
    cancel: "Cancel",
    error: "Could not save the post.",
  },
  contact: {
    title: "Contact the store",
    subtitle: "A question about a product, an order or delivery? Send a message.",
    name: "Your name",
    email: "Your email",
    message: "Your message",
    send: "Send message",
    sending: "Sending…",
    sentTitle: "Message sent",
    sentText: "The store will reply to the address you provided.",
    error: "Could not send the message. Try again.",
    required: "Complete the required fields.",
    back: "Back to the store",
  },
};

export function getStoreAdminCopy(locale: Locale | string): StoreAdminCopy {
  return locale === "en" ? en : fr;
}
