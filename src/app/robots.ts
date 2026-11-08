import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/app/",
          "/*/app/",
          "/platform-admin/",
          "/onboarding/",
          "/*/onboarding/",
          "/auth/",
          "/*/auth/",
          "/dev-preview/",
        ],
      },
    ],
    sitemap: "https://pashove.com/sitemap.xml",
    host: "https://pashove.com",
  };
}
