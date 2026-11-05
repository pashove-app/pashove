import { NextResponse } from "next/server";
import { renderEmail } from "@/lib/email/templates";
import { deliverEmail, emailDriver } from "@/lib/email/transport";

export const dynamic = "force-dynamic";

/** Envoi réel de contrôle, réservé au développement. */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { to?: string } | null;
  const to = body?.to?.trim();

  if (!to || !to.includes("@")) {
    return NextResponse.json({ error: "invalid_recipient" }, { status: 400 });
  }

  if (emailDriver() !== "brevo") {
    return NextResponse.json(
      {
        ok: false,
        driver: emailDriver(),
        error: "EMAIL_DRIVER n'est pas sur brevo ou BREVO_API_KEY est absente.",
      },
      { status: 409 },
    );
  }

  const rendered = renderEmail(
    "welcome",
    {
      customerName: "Ibrahim",
      ctaUrl: `${(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}/fr/app`,
    },
    "fr",
  );

  const result = await deliverEmail({
    to,
    toName: "Ibrahim",
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    template: "welcome",
  });

  return NextResponse.json(
    { ...result, driver: emailDriver() },
    { status: result.ok ? 200 : 502 },
  );
}
