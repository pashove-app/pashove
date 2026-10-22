import type { StoreProduct } from "@/lib/storefront/products";

export type TagCollection = {
  tag: string;
  count: number;
  imageKey: string | null;
};

/**
 * Collections provisoires, dérivées des tags.
 *
 * La même interface servira aux vraies collections : nom, visuel, nombre de
 * pièces. On ne dépend donc pas du modèle définitif pour habiller l'accueil.
 */
export function buildTagCollections(
  products: StoreProduct[],
  limit = 6,
): TagCollection[] {
  const map = new Map<string, TagCollection>();

  for (const product of products) {
    for (const raw of product.tags) {
      const tag = raw.trim();
      if (!tag) continue;

      const current = map.get(tag);
      const imageKey = product.images[0]?.object_key ?? null;

      if (current) {
        current.count += 1;
        if (!current.imageKey && imageKey) current.imageKey = imageKey;
      } else {
        map.set(tag, { tag, count: 1, imageKey });
      }
    }
  }

  return [...map.values()]
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag))
    .slice(0, limit);
}
