import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon, icons } from "@/components/ui/primitives";
import { resolveLocale } from "@/i18n/config";
import { completeOnboardingStepAction } from "@/lib/onboarding/actions";
import { getOnboardingChecklist } from "@/lib/onboarding/checklist";
import { currentStore } from "@/lib/stores/queries";

export const metadata: Metadata = {
  title: "Installation",
  robots: { index: false, follow: false },
};

export default async function OnboardingChecklistPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ published?: string }>;
}) {
  const { locale: raw } = await params;
  const { published } = await searchParams;
  const locale = resolveLocale(raw);

  const store = await currentStore();
  if (!store) redirect(`/${locale}/onboarding/store`);

  const steps = await getOnboardingChecklist(store, locale);
  const completed = steps.filter((step) => step.done).length;
  const percent = Math.round((completed / steps.length) * 100);

  return (
    <div className="mx-auto w-full max-w-3xl">
      {published ? (
        <div className="mb-5 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] px-4 py-3 text-[0.8125rem] text-emerald-700 dark:text-emerald-300">
          Ta boutique est publiée. Voici les 15 étapes pour être prêt à vendre.
        </div>
      ) : null}

      <header>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-faint">
          Démarrage
        </p>
        <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-fg sm:text-[2rem]">
          Installation de ta boutique
        </h1>
        <p className="mt-1 text-[0.8125rem] text-subtle">
          {completed} étape{completed === 1 ? "" : "s"} sur {steps.length} terminée
          {completed === 1 ? "" : "s"}.
        </p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-hairline">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </header>

      <ol className="mt-6 divide-y divide-hairline overflow-hidden rounded-3xl border border-border bg-surface">
        {steps.map((step, index) => (
          <li key={step.key} className="flex items-start gap-3 px-4 py-4 sm:px-5">
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold ${
                step.done
                  ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                  : "bg-hairline text-subtle"
              }`}
            >
              {step.done ? (
                <Icon path={icons.check} className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : (
                index + 1
              )}
            </span>

            <div className="min-w-0 flex-1">
              <Link
                href={step.href}
                className={`text-[0.875rem] font-medium ${
                  step.done ? "text-subtle line-through" : "text-fg hover:text-accent"
                }`}
              >
                {step.label}
              </Link>
              <p className="mt-0.5 text-[0.75rem] leading-relaxed text-subtle">
                {step.description}
              </p>
            </div>

            {!step.done && step.manual ? (
              <form action={completeOnboardingStepAction}>
                <input type="hidden" name="step" value={step.key} />
                <button
                  type="submit"
                  className="shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-[0.6875rem] font-medium text-body hover:border-border-strong"
                >
                  Marquer fait
                </button>
              </form>
            ) : !step.done ? (
              <Link
                href={step.href}
                className="shrink-0 text-[0.75rem] font-medium text-accent hover:text-accent-soft"
              >
                Faire
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
