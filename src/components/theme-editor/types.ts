import type { ThemeCollectionCard, ThemeProductCard } from "@/components/theme-renderer/context";

export type ThemeMetafieldOption = {
  id?: string;
  owner: "product" | "collection" | "page" | "article" | "shop";
  ownerId: string;
  namespace: string;
  key: string;
  label: string;
  value?: unknown;
};

export type { ThemeCollectionCard, ThemeProductCard };
