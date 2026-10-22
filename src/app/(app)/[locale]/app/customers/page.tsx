import { redirect } from "next/navigation";
import { resolveLocale } from "@/i18n/config";

/** Ancienne adresse : la liste des clients vit désormais sous /app/clients. */
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${resolveLocale(locale)}/app/clients`);
}
