export const POLICY_PAGES = [
  { slug: "mentions", url: "mentions-legales" },
  { slug: "terms", url: "cgu" },
  { slug: "privacy", url: "confidentialite" },
  { slug: "shipping", url: "livraison" },
  { slug: "returns", url: "retours" },
] as const;

export type PolicySlug = (typeof POLICY_PAGES)[number]["slug"];

export function policyUrlSlug(slug: PolicySlug): string {
  return POLICY_PAGES.find((page) => page.slug === slug)?.url ?? slug;
}

export function policySlugFromUrl(url: string): PolicySlug | null {
  return POLICY_PAGES.find((page) => page.url === url)?.slug ?? null;
}
