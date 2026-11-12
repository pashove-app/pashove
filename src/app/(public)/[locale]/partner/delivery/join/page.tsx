import type { Metadata } from "next";
import { PartnerJoinForm } from "@/components/delivery-partners/join-forms";
import { joinDeliveryPartnerAction } from "@/lib/delivery-partners/actions";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Rejoindre Pashove en tant que partenaire",
  robots: { index: false, follow: false },
};

export default async function PartnerJoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const service = createServiceClient();

  const { data: partner } = service && token
    ? await service
        .from("delivery_partners")
        .select("company_name, email, status")
        .eq("invite_token", token)
        .maybeSingle()
    : { data: null };

  if (!partner || partner.status !== "invited" || !token) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center px-4 py-16">
        <div className="w-full rounded-3xl border border-border bg-surface p-8 text-center">
          <h1 className="text-[1.5rem] font-medium text-fg">
            Lien d’invitation invalide
          </h1>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-subtle">
            Ce lien a déjà été utilisé ou a expiré. Contacte Pashove pour
            recevoir une nouvelle invitation.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16">
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-faint">
          Livraison partenaire
        </p>
        <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg">
          Créez votre espace
        </h1>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-subtle">
          Gérez votre flotte, vos courses et vos revenus depuis un espace dédié.
        </p>
        <PartnerJoinForm
          token={token}
          email={partner.email}
          company={partner.company_name}
          action={joinDeliveryPartnerAction}
        />
      </div>
    </main>
  );
}
