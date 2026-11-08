import { NextResponse } from "next/server";
import { isLocale } from "@/i18n/config";

/**
 * Manifeste propre à l'espace livreur.
 *
 * Il est servi sous `/{locale}/app/courier/` et non à la racine : un marchand
 * qui visite le site ne doit pas se voir proposer l'installation de l'app
 * livreur. L'URL du manifeste détermine aussi le périmètre de l'application
 * installée — le livreur reste dans son espace.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "fr";
  const home = `/${locale}/app/courier`;

  const description =
    locale === "en"
      ? "Pashove Delivery courier space: rides, deliveries and earnings."
      : "Espace livreur Pashove Delivery : courses, livraisons et gains.";

  const manifest = {
    id: home,
    name: "Pashove Delivery",
    short_name: "Pashove",
    description,
    lang: locale,
    dir: "ltr",
    start_url: home,
    scope: home,
    display: "standalone",
    orientation: "portrait",
    background_color: "#04060d",
    theme_color: "#2F5CFF",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
