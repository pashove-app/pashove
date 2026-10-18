import type { IconKey } from "@/components/ui/primitives";

/**
 * Source unique de la navigation marchande.
 *
 * La sidebar et la palette de commandes lisent la même liste : une section
 * ajoutée ici apparaît aux deux endroits, sans risque d'oubli.
 */
export type NavKey =
  | "home"
  | "orders"
  | "products"
  | "customers"
  | "growth"
  | "discounts"
  | "content"
  | "analytics"
  | "onlineStore"
  | "settings";

export type NavItem = {
  key: NavKey;
  /** Chemin sans préfixe de langue ; `path()` l'ajoute à l'affichage. */
  href: string;
  icon: IconKey;
};

export const NAV_MAIN: NavItem[] = [
  { key: "home", href: "/app", icon: "home" },
  { key: "orders", href: "/app/orders", icon: "box" },
  { key: "products", href: "/app/products", icon: "tag" },
  { key: "customers", href: "/app/customers", icon: "users" },
  { key: "growth", href: "/app/growth", icon: "bolt" },
  { key: "discounts", href: "/app/discounts", icon: "percent" },
  { key: "content", href: "/app/content", icon: "chat" },
  { key: "analytics", href: "/app/analytics", icon: "chart" },
];

export const NAV_STORE: NavItem = {
  key: "onlineStore",
  href: "/app/online-store",
  icon: "store",
};

export const NAV_SETTINGS: NavItem = {
  key: "settings",
  href: "/app/settings",
  icon: "settings",
};

export const NAV_ALL: NavItem[] = [...NAV_MAIN, NAV_STORE, NAV_SETTINGS];
