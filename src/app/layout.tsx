import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import { ThemeWatcher } from "@/components/theme/theme-watcher";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/** Police de repli pour l'arabe (Geist ne couvre pas l'alphabet arabe). */
const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pashove.com"),
  applicationName: "Pashove",
  authors: [{ name: "Pashove", url: "https://pashove.com" }],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#04060d" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

/**
 * Amorçage exécuté avant le premier rendu : applique le thème et la langue
 * depuis l'URL. Poser ces attributs ici — et non depuis une lecture de
 * `headers()` côté serveur — évite deux problèmes :
 *   1. lire les en-têtes dans le layout racine rendait **toutes** les routes
 *      dynamiques, donc aucune page n'était pré-rendue ;
 *   2. les navigations client passent par `/_next`, que le proxy n'annote pas,
 *      si bien que ce même layout réécrivait `dir="ltr"` en revenant d'une
 *      page arabe.
 * `suppressHydrationWarning` sur <html> empêche React de repatcher ces
 * attributs pendant l'hydratation.
 */
const BOOT_SCRIPT = `(function(){try{var s=localStorage.getItem("pashove-theme");var sys=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.setAttribute("data-theme",(s==="light"||s==="dark")?s:sys);}catch(e){document.documentElement.setAttribute("data-theme","dark");}try{var m={fr:["fr-FR","ltr"],en:["en","ltr"],bm:["bm","ltr"],ln:["ln","ltr"],ar:["ar","rtl"]};var p=m[location.pathname.split("/")[1]];if(p){document.documentElement.lang=p[0];document.documentElement.dir=p[1];}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      dir="ltr"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-bg text-fg">
        <ThemeWatcher />
        {children}
      </body>
    </html>
  );
}
