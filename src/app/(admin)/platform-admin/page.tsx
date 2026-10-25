import Link from "next/link";
import { AdminHero } from "@/components/platform/admin-hero";
import { ButtonLink, Icon, icons, type IconKey } from "@/components/ui/primitives";
import { adminCounts } from "@/lib/platform/queries";

export default async function AdminOverviewPage() {
  const counts = await adminCounts();

  const cards: {
    href: string;
    icon: IconKey;
    label: string;
    value: number;
    text: string;
  }[] = [
    {
      href: "/platform-admin/kyc",
      icon: "shield",
      label: "KYC en attente",
      value: counts.kycPending,
      text: "Dossiers à vérifier ou en cours de revue.",
    },
    {
      href: "/platform-admin/payouts",
      icon: "wallet",
      label: "Retraits en attente",
      value: counts.payoutsPending,
      text: "Demandes à valider ou déjà vérifiées.",
    },
    {
      href: "/platform-admin/reconciliation",
      icon: "store",
      label: "Boutiques suivies",
      value: counts.stores,
      text: "Boutiques présentes dans le ledger.",
    },
    {
      href: "/platform-admin/audit",
      icon: "list",
      label: "Actions auditées",
      value: counts.auditActions,
      text: "Décisions sensibles enregistrées.",
    },
  ];

  return (
    <div>
      <AdminHero subtitle="Les files sensibles de Pashove, le contrôle du ledger et les décisions de l'équipe — sans accès inutile aux données des marchands.">
        <ButtonLink href="/platform-admin/kyc" variant="light" size="pill">
          <Icon path={icons.shield} className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} />
          Ouvrir les KYC
        </ButtonLink>
        <ButtonLink href="/platform-admin/payouts" variant="light" size="pill">
          <Icon path={icons.wallet} className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} />
          Voir les retraits
        </ButtonLink>
      </AdminHero>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-3xl border border-border bg-surface p-5 transition-all hover:border-border-strong hover:shadow-[0_18px_40px_-30px_rgba(0,0,0,0.8)] sm:p-6"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/[0.12] text-accent">
                <Icon path={icons[card.icon]} className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} />
              </span>
              <Icon
                path={icons.arrowUpRight}
                className="h-4 w-4 text-faint opacity-0 transition-opacity group-hover:opacity-100"
                strokeWidth={1.8}
              />
            </div>
            <p className="mt-5 text-[0.75rem] text-subtle">{card.label}</p>
            <p className="mt-1.5 text-[1.75rem] font-semibold tabular-nums tracking-[-0.035em] text-fg">
              {card.value}
            </p>
            <p className="mt-1 text-[0.75rem] leading-relaxed text-faint">{card.text}</p>
          </Link>
        ))}
      </div>

      <section className="mt-5 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-[0.9375rem] font-medium text-fg">Accès rapides</h2>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <ButtonLink href="/platform-admin/kyc" variant="outline" size="pill">
            <Icon path={icons.shield} className="h-4 w-4" strokeWidth={1.8} />
            KYC
          </ButtonLink>
          <ButtonLink href="/platform-admin/payouts" variant="outline" size="pill">
            <Icon path={icons.wallet} className="h-4 w-4" strokeWidth={1.8} />
            Retraits
          </ButtonLink>
          <ButtonLink href="/platform-admin/reconciliation" variant="outline" size="pill">
            <Icon path={icons.chart} className="h-4 w-4" strokeWidth={1.8} />
            Réconciliation
          </ButtonLink>
          <ButtonLink href="/platform-admin/audit" variant="outline" size="pill">
            <Icon path={icons.list} className="h-4 w-4" strokeWidth={1.8} />
            Audit
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
