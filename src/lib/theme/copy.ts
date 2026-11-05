import type { Locale } from "@/i18n/config";

export type BlockCopy = {
  title: string;
  add: string;
  empty: string;
  drag: string;
  up: string;
  down: string;
  remove: string;
  enabled: string;
  blockTitle: string;
  body: string;
  imageUrl: string;
  videoUrl: string;
  ctaLabel: string;
  ctaHref: string;
  items: string;
  itemTitle: string;
  itemText: string;
  itemAuthor: string;
  addItem: string;
  removeItem: string;
  types: Record<string, string>;
};

const fr: BlockCopy = {
  title: "Blocs de la page d’accueil",
  add: "Ajouter un bloc",
  empty: "Aucun bloc. Ajoute un texte, une image ou une FAQ.",
  drag: "Glisser pour réordonner",
  up: "Monter",
  down: "Descendre",
  remove: "Supprimer",
  enabled: "Visible",
  blockTitle: "Titre",
  body: "Texte",
  imageUrl: "URL de l’image",
  videoUrl: "URL de la vidéo",
  ctaLabel: "Bouton",
  ctaHref: "Lien du bouton",
  items: "Éléments",
  itemTitle: "Titre",
  itemText: "Texte",
  itemAuthor: "Auteur",
  addItem: "Ajouter un élément",
  removeItem: "Retirer",
  types: {
    text: "Texte",
    image: "Image",
    video: "Vidéo",
    newsletter: "Newsletter",
    faq: "FAQ",
    testimonials: "Témoignages",
  },
};

const en: BlockCopy = {
  title: "Homepage blocks",
  add: "Add a block",
  empty: "No block yet. Add text, an image or a FAQ.",
  drag: "Drag to reorder",
  up: "Move up",
  down: "Move down",
  remove: "Remove",
  enabled: "Visible",
  blockTitle: "Title",
  body: "Text",
  imageUrl: "Image URL",
  videoUrl: "Video URL",
  ctaLabel: "Button",
  ctaHref: "Button link",
  items: "Items",
  itemTitle: "Title",
  itemText: "Text",
  itemAuthor: "Author",
  addItem: "Add an item",
  removeItem: "Remove",
  types: {
    text: "Text",
    image: "Image",
    video: "Video",
    newsletter: "Newsletter",
    faq: "FAQ",
    testimonials: "Testimonials",
  },
};

export function getBlockCopy(locale: Locale | string): BlockCopy {
  return locale === "en" ? en : fr;
}
