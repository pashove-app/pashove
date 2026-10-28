import { AdminHero } from "@/components/platform/admin-hero";
import { ProviderConfigForm } from "@/components/platform/provider-config-form";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { adminPaymentProviders } from "@/lib/payments/queries";

const STATUS_LABEL = {
  active: "Actif",
  not_configured: "À configurer",
  disabled: "Désactivé",
} as const;

function statusTone(status: string): string {
  if (status === "active") return "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-700 dark:text-emerald-300";
  if (status === "disabled") return "border-red-400/25 bg-red-400/[0.06] text-red-600 dark:text-red-400";
  return "border-amber-400/25 bg-amber-400/[0.07] text-amber-700 dark:text-amber-300";
}

export default async function AdminProvidersPage() {
  const providers = await adminPaymentProviders();

  return (
    <div>
      <AdminHero subtitle="Les passerelles de paiement, leurs clés chiffrées et leur état de configuration.">
        <ButtonLink href="/platform-admin/payments" variant="light" size="pill">
          <Icon path={icons.wallet} className="h-4 w-4" strokeWidth={1.8} />
          Transactions
        </ButtonLink>
      </AdminHero>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {providers.map((provider) => (
          <section key={provider.code} className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-faint">
                  {provider.code}
                </p>
                <h2 className="mt-1 text-[1.125rem] font-medium text-fg">{provider.name}</h2>
                <p className="mt-1 text-[0.75rem] text-subtle">
                  Mode {provider.mode} · {provider.configured ? "clés enregistrées" : "aucune clé enregistrée"}
                </p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wide ${statusTone(provider.status)}`}>
                {STATUS_LABEL[provider.status]}
              </span>
            </div>

            {provider.code === "mock" ? (
              <ProviderConfigForm provider={provider} />
            ) : (
              <details className="mt-4 border-t border-hairline pt-4">
                <summary className="cursor-pointer text-[0.75rem] font-medium text-accent">
                  Configurer
                </summary>
                <ProviderConfigForm provider={provider} />
              </details>
            )}
          </section>
        ))}
      </div>

      <p className="mt-5 text-[0.6875rem] leading-relaxed text-faint">
        Les clés sont chiffrées en AES-256-GCM côté serveur avant stockage. Le
        fournisseur Mock est actif en mode test ; Flutterwave, CinetPay et
        PayDunya attendent leurs clés.
      </p>
    </div>
  );
}
