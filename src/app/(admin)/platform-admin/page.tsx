import Link from "next/link";
import { Icon, icons } from "@/components/ui/primitives";
import { adminCounts } from "@/lib/platform/queries";

export default async function AdminOverviewPage() {
  const counts = await adminCounts();

  const cards = [
    {
      href: "/platform-admin/kyc",
      icon: icons.shield,
      label: "KYC en attente",
      value: counts.kycPending,
      text: "Dossiers à vérifier ou en cours de revue.",
    },
    {
      href: "/platform-admin/payouts",
      icon: icons.wallet,
      label: "Retraits en attente",
      value: counts.payoutsPending,
      text: "Demandes à valider ou déjà vérifiées.",
    },
  ];

  return (
    <div>
      <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-fg sm:text-[2rem]">
        Administration plateforme
      </h1>
      <p className="mt-1.5 text-[0.9375rem] text-muted">
        Les files sensibles de Pashove, sans accès inutile aux données des
        marchands.
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-3xl border border-border bg-surface p-6 transition-colors hover:border-border-strong"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500/[0.12] text-accent">
              <Icon path={card.icon} className="h-5 w-5" strokeWidth={1.7} />
            </span>
            <p className="mt-4 text-[0.75rem] text-subtle">{card.label}</p>
            <p className="mt-1 text-[2rem] font-semibold tabular-nums text-fg">
              {card.value}
            </p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
              {card.text}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
