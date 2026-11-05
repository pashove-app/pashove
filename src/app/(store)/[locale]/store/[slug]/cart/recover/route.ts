import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CART_COOKIE, isCartToken } from "@/lib/storefront/cart";

/** Rouvre un panier depuis le lien de rappel : le jeton repart en cookie HttpOnly. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (isCartToken(token)) {
    (await cookies()).set(CART_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return NextResponse.redirect(
    new URL(`/${locale}/store/${slug}/cart`, request.url),
  );
}
