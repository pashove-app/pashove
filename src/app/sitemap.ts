import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

const BASE_URL = "https://pashove.com";
const LOCALES = ["fr", "en"] as const;

const PUBLIC_PAGES = [
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/features", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/themes", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.6, changeFrequency: "yearly" as const },
  { path: "/help", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/docs", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/status", priority: 0.5, changeFrequency: "daily" as const },
  { path: "/devenir-livreur", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/legal/mentions", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/legal/cgu", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/legal/confidentialite", priority: 0.3, changeFrequency: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const page of PUBLIC_PAGES) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }
  }

  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("stores")
      .select("slug, updated_at")
      .eq("status", "active")
      .limit(1000);

    for (const store of (data ?? []) as { slug: string; updated_at: string }[]) {
      for (const locale of LOCALES) {
        const modified = store.updated_at
          ? new Date(store.updated_at)
          : new Date();

        entries.push({
          url: `${BASE_URL}/${locale}/store/${store.slug}`,
          lastModified: modified,
          changeFrequency: "weekly",
          priority: 0.8,
        });

        for (const sub of ["categories", "services", "about", "faq", "blog"]) {
          entries.push({
            url: `${BASE_URL}/${locale}/store/${store.slug}/${sub}`,
            lastModified: modified,
            changeFrequency: "weekly",
            priority: 0.5,
          });
        }
      }
    }
  } catch {
    // Le sitemap statique reste valide même si la base est momentanément
    // indisponible.
  }

  return entries;
}
