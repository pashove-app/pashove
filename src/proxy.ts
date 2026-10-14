import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
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

  // Route déjà préfixée par une langue : on l'annonce au layout racine, et on
  // laisse Supabase renouveler la session dans la foulée.
  if (isLocale(first)) {
    const headers = new Headers(request.headers);
    headers.set("x-pashove-locale", first);

    const response = NextResponse.next({ request: { headers } });
    response.cookies.set(LOCALE_COOKIE, first, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    // Seul endroit d'où l'on peut réécrire les cookies de session : un Server
    // Component en est incapable. Sans ce passage, la session expire sans se
    // renouveler.
    return refreshSession(request, response);
  }

  // Sinon on redirige vers la langue négociée.
  const locale = negotiate(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\.[^/]+$).*)"],
};
