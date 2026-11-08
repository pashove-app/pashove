import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrackingView } from "@/components/tracking/tracking-view";
import { resolveLocale } from "@/i18n/config";
import { getPublicTracking } from "@/lib/delivery/tracking";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata: Metadata = {
  title: "Suivi de commande · Pashove",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Suivi public par jeton de commande.
 *
 * Le jeton est une capacité : il est envoyé au client dans le lien de
 * confirmation. Aucune donnée n'est lisible sans lui.
 */
export default async function TrackPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale: raw, orderId } = await params;
  const locale = resolveLocale(raw);

  if (!UUID_PATTERN.test(orderId)) notFound();

  const data = await getPublicTracking(orderId);
  if (!data) notFound();

  return (
    <TrackingView
      token={orderId}
      locale={locale === "en" ? "en" : "fr"}
      initial={data}
    />
  );
}
