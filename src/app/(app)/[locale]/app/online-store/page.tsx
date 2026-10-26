import { redirect } from "next/navigation";
import { resolveLocale } from "@/i18n/config";

export default async function OnlineStorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  redirect(`/${resolveLocale(raw)}/app/online-store/themes`);
}
