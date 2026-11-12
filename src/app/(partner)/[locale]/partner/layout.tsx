import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Protège tout l'espace partenaire.
 *
 * Le middleware bloque déjà l'absence de session ; ce layout vérifie en plus
 * que le compte est bien rattaché à une entreprise de livraison active. Un
 * marchand connecté est renvoyé vers la connexion partenaire, jamais vers
 * l'onboarding marchand.
 */
export default async function PartnerLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupabaseConfigured()) redirect(`/${locale}/partner/login`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/partner/login`);

  const { data: partner } = await supabase
    .from("delivery_partners")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!partner) redirect(`/${locale}/partner/login`);

  return <>{children}</>;
}
