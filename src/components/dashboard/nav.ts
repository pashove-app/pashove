import type { IconKey } from "@/components/ui/primitives";

/**
 * Source unique de la navigation marchande — section 200 du plan directeur.
 *
 * La sidebar, la feuille mobile et la palette de commandes lisent la même
 * liste : une section ajoutée ici apparaît aux trois endroits.
 */
export type NavKey =
  | "home"
  | "orders"
  | "products"
  | "collections"
  | "bundles"
  | "customers"
  | "marketing"
  | "discounts"
  | "onlineStore"
  | "salesChannels"
  | "partners"
  | "gifts"
  | "analytics"
  | "finance"
  | "settings"
  | "apps"
  | "support";

export type NavItem = {
  key: NavKey;
  /** Chemin sans préfixe de langue ; `path()` l'ajoute à l'affichage. */
  href: string;
  icon: IconKey;
  /** Section encore en construction : affichée avec un badge « Bientôt ». */
  soon?: boolean;
};

export type NavGroup = {
  /** Clé de libellé ; absente pour le premier groupe, qui n'en a pas besoin. */
  labelKey?: "store" | "insight";
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { key: "home", href: "/app", icon: "home" },
      { key: "orders", href: "/app/orders", icon: "box" },
      { key: "products", href: "/app/products", icon: "tag" },
      { key: "collections", href: "/app/collections", icon: "layers" },
      { key: "bundles", href: "/app/bundles", icon: "bundle" },
      { key: "customers", href: "/app/clients", icon: "users" },
      { key: "marketing", href: "/app/marketing", icon: "bolt", soon: true },
      { key: "discounts", href: "/app/discounts", icon: "percent" },
    ],
  },
  {
    labelKey: "store",
    items: [
      { key: "onlineStore", href: "/app/online-store/themes", icon: "store" },
      { key: "salesChannels", href: "/app/sales-channels", icon: "globe", soon: true },
      { key: "partners", href: "/app/partners", icon: "route" },
      { key: "gifts", href: "/app/gifts", icon: "gift" },
    ],
  },
  {
    labelKey: "insight",
    items: [
      { key: "analytics", href: "/app/analytics", icon: "chart", soon: true },
      { key: "finance", href: "/app/finance", icon: "wallet" },
    ],
  },
];

/** Réglages et services : rendus en bas de la navigation, après un trait. */
export const NAV_SYSTEM: NavItem[] = [
  { key: "settings", href: "/app/settings", icon: "settings" },
  { key: "apps", href: "/app/apps", icon: "grid", soon: true },
  { key: "support", href: "/app/support", icon: "chat" },
];

export const NAV_ALL: NavItem[] = [
  ...NAV_GROUPS.flatMap((group) => group.items),
  ...NAV_SYSTEM,
];

/** Barre mobile. Le cinquième emplacement est le bouton « Menu ». */
export const BOTTOM_NAV: NavItem[] = [
  { key: "home", href: "/app", icon: "home" },
  { key: "products", href: "/app/products", icon: "tag" },
  { key: "orders", href: "/app/orders", icon: "box" },
  { key: "customers", href: "/app/clients", icon: "users" },
];
