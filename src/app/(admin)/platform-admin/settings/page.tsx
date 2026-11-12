import { AdminHero } from "@/components/platform/admin-hero";
import {
  AdminAccounts,
  PlanEditor,
  SettingsToggles,
} from "@/components/platform/admin-settings-forms";
import { ButtonLink, Icon, icons } from "@/components/ui/primitives";
import { getAdminSettings } from "@/lib/platform/admin-queries";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminSettingsPage() {
  const data = await getAdminSettings();

  if (!data) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-8">
        <p className="text-[0.9375rem] font-medium text-fg">
          Réglages indisponibles
        </p>
        <p className="mt-2 text-[0.8125rem] text-subtle">
          Ton rôle ne permet pas de lire la configuration plateforme.
        </p>
      </div>
    );
  }

  return (
    <div>
      <AdminHero subtitle="Les plans, limites, interrupteurs globaux et accès à la console plateforme.">
        <ButtonLink href="/platform-admin/audit" variant="light" size="pill">
          <Icon path={icons.list} className="h-4 w-4" strokeWidth={1.8} />
          Journal d’audit
        </ButtonLink>
      </AdminHero>

      <section className="mt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[1rem] font-medium text-fg">Plans</h2>
            <p className="mt-1 text-[0.75rem] text-subtle">
              Commission en points de base : 600 = 6 %, 200 = 2 %, 0 = 0 %.
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {data.plans.map((plan) => (
            <PlanEditor key={plan.code} plan={plan} />
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section>
          <h2 className="text-[1rem] font-medium text-fg">
            Interrupteurs globaux
          </h2>
          <p className="mt-1 text-[0.75rem] text-subtle">
            Ces réglages sont journalisés et prennent effet immédiatement.
          </p>
          <div className="mt-3">
            <SettingsToggles settings={data.settings} />
          </div>
        </section>

        <section>
          <h2 className="text-[1rem] font-medium text-fg">
            Accès plateforme
          </h2>
          <p className="mt-1 text-[0.75rem] text-subtle">
            Les comptes internes qui peuvent ouvrir cette console.
          </p>
          <div className="mt-3">
            <AdminAccounts admins={data.admins} />
          </div>
        </section>
      </div>
    </div>
  );
}
