import type { NextConfig } from "next";

/**
 * Images servies depuis R2 : on autorise l'optimiseur de Next à les relire.
 * L'hôte vient de la variable publique, pour que le passage à
 * `cdn.pashove.com` ne demande aucune modification de code.
 */
const publicMediaUrl = process.env.R2_PUBLIC_URL;

const nextConfig: NextConfig = {
  images: publicMediaUrl
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: new URL(publicMediaUrl).hostname,
            pathname: "/**",
          },
        ],
      }
    : undefined,

  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
