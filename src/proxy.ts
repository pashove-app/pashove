import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { courierIntent } from "@/lib/auth/redirects";
import { refreshSession } from "@/lib/supabase/session";

/** Fichiers servis tels quels (images, polices, robots.txt…). */
const HAS_EXTENSION = /\.[^/]+$/;

const LOCALE_COOKIE = "pashove_locale";

function negotiate(request: NextRequest): Locale {
  const fromCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const header = request.headers.get("accept-language") ?? "";
  for (const entry of header.split(",")) {
    const code = entry.split(";")[0]?.trim().toLowerCase().slice(0, 2);
    if (isLocale(code)) return code;
  }

  return DEFAULT_LOCALE;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    HAS_EXTENSION.test(pathname)
  ) {
    return NextResponse.next();
  }

  const first = pathname.split("/")[1] ?? "";

  // Attribution d'affiliation : cookie de 30 jours, validé au checkout.
  const rawRef = request.nextUrl.searchParams.get("ref");
  const affiliateRef =
    rawRef && /^[A-Za-z0-9]{6,16}$/.test(rawRef) ? rawRef.toUpperCase() : null;

  const withRef = (response: NextResponse) => {
    if (affiliateRef) {
      response.cookies.set("pashove_ref", affiliateRef, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
    }
    return response;
  };

  // L'administration plateforme vit hors du préfixe de langue : elle est
  // interne, en français, et doit rester accessible à /platform-admin.
  if (pathname === "/platform-admin" || pathname.startsWith("/platform-admin/")) {
    return withRef(await refreshSession(request, NextResponse.next()));
  }

  // Pages légales publiques de la plateforme, hors préfixe de langue.
  if (pathname === "/legal" || pathname.startsWith("/legal/")) {
    return withRef(NextResponse.next());
  }

  // Route déjà préfixée par une langue : on l'annonce au layout racine, et on
  // laisse Supabase renouveler la session dans la foulée.
  if (isLocale(first)) {
    const headers = new Headers(request.headers);
    headers.set("x-pashove-locale", first);

    // L'inscription et la connexion livreur masquent le volet marchand. Le
    // layout d'authentification lit cet en-tête ; sans lui, il faudrait
    // convertir tout le volet en composant client.
    const isAuthScreen =
      pathname === `/${first}/auth/register` ||
      pathname === `/${first}/auth/login` ||
      pathname === `/${first}/auth/verify-email`;

    if (
      isAuthScreen &&
      courierIntent({
        redirect: request.nextUrl.searchParams.get("redirect") ?? undefined,
        role: request.nextUrl.searchParams.get("role") ?? undefined,
      })
    ) {
      headers.set("x-pashove-courier", "1");
    }

    const response = NextResponse.next({ request: { headers } });
    response.cookies.set(LOCALE_COOKIE, first, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    // Seul endroit d'où l'on peut réécrire les cookies de session : un Server
    // Component en est incapable. Sans ce passage, la session expire sans se
    // renouveler.
    return withRef(await refreshSession(request, response));
  }

  // Sinon on redirige vers la langue négociée.
  const locale = negotiate(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return withRef(NextResponse.redirect(url));
}

export const config = {
  matcher: ["/((?!api|_next|.*\\.[^/]+$).*)"],
};
