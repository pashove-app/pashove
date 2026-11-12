import type { Metadata } from "next";
import { DriverJoinForm } from "@/components/delivery-partners/join-forms";
import { joinPartnerDriverAction } from "@/lib/delivery-partners/actions";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Rejoindre une flotte partenaire Pashove",
  robots: { index: false, follow: false },
};

export default async function DriverJoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const service = createServiceClient();

  type DriverInvite = {
    name: string;
    email: string;
    phone: string;
    status: string;
    partner: { company_name?: string } | null;
  };

  let driver: DriverInvite | null = null;

  if (service && code) {
    const { data } = await service
      .from("partner_drivers")
      .select("name, email, phone, status, partner:delivery_partners(company_name)")
      .eq("invite_code", code)
      .maybeSingle();
    driver = data as DriverInvite | null;
  }

  if (!driver || driver.status !== "invited" || !code) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center px-4 py-16">
        <div className="w-full rounded-3xl border border-border bg-surface p-8 text-center">
          <h1 className="text-[1.5rem] font-medium text-fg">
            Code d’invitation invalide
          </h1>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-subtle">
            Ce code a déjà été utilisé ou a expiré. Demande un nouveau code à
            ton entreprise de livraison.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16">
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-faint">
          Flotte partenaire
        </p>
        <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg">
          Rejoignez la flotte
        </h1>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-subtle">
          Créez votre compte pour recevoir les courses de votre entreprise.
        </p>
        <DriverJoinForm
          code={code}
          name={driver.name}
          email={driver.email}
          phone={driver.phone}
          company={driver.partner?.company_name ?? "Partenaire Pashove"}
          action={joinPartnerDriverAction}
        />
      </div>
    </main>
  );
}
