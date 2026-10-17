"use client";

import { useActionState } from "react";
import { StepProgress } from "@/components/onboarding/step-progress";
import { FormNotice } from "@/components/ui/field";
import {
  buttonClass,
  ButtonLink,
  Icon,
  icons,
  Spinner,
} from "@/components/ui/primitives";
import { path, type SectionProps } from "@/components/ui/types";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Profile } from "@/lib/profile/queries";
import { publishStoreAction } from "@/lib/stores/actions";
import type { Store } from "@/lib/stores/queries";
import { STORE_DOMAIN } from "@/lib/stores/schema";
import { INITIAL_STORE_FORM_STATE } from "@/lib/stores/types";

/**
 * Étape 4 : récapitulatif et publication.
 *
 * Le marchand relit ce qu'il a saisi, puis ouvre sa boutique. Les sections
 * entrent l'une après l'autre — assez pour donner du rythme à un écran de
 * lecture, jamais au point de retarder le bouton.
 */
export function LaunchForm({
  t,
  locale,
  stepLabel,
  store,
  profile,
}: SectionProps & { stepLabel: string; store: Store; profile: Profile }) {
  const [state, formAction, pending] = useActionState(
    publishStoreAction,
    INITIAL_STORE_FORM_STATE,
  );

  const errors = t.onboarding.errors as Record<string, string>;
  const formMessage = state.messageKey ? errors[state.messageKey] : undefined;

  const countryName = (code: string | null) =>
    code
      ? t.countries_names[code as keyof Dictionary["countries_names"]] ?? code
      : "—";

  const typeLabels: Record<string, string> = {
    physical: t.onboarding.productPhysical,
    digital: t.onboarding.productDigital,
    service: t.onboarding.productService,
  };

  const sections = [
    {
      title: t.onboarding.launchStoreSection,
      rows: [
        { label: t.onboarding.storeNameLabel, value: store.name, ltr: false },
        {
          label: t.onboarding.slugLabel,
          value: `${store.slug}.${STORE_DOMAIN}`,
          ltr: true,
        },
        {
          label: t.onboarding.countryLabel,
          value: countryName(store.country),
          ltr: false,
        },
        { label: t.onboarding.currencyLabel, value: store.currency, ltr: true },
      ],
    },
    {
      title: t.onboarding.launchProfileSection,
      rows: [
        { label: t.onboarding.profileNameLabel, value: profile.full_name, ltr: false },
        { label: t.onboarding.phoneLabel, value: profile.phone ?? "—", ltr: true },
        {
          label: t.onboarding.profileCountryLabel,
          value: countryName(profile.country),
          ltr: false,
        },
        { label: t.onboarding.timezoneLabel, value: profile.timezone, ltr: true },
      ],
    },
  ];

  return (
    <div>
      <StepProgress current={4} total={4} label={stepLabel} />

      <h1 className="mt-6 text-[clamp(2.05rem,1.35rem+2.4vw,2.85rem)] font-semibold leading-[1.04] tracking-[-0.045em] text-balance text-fg">
        {t.onboarding.launchTitle}
      </h1>
      <p className="mt-4 max-w-lg text-[0.9875rem] leading-relaxed text-muted">
        {t.onboarding.launchSubtitle}
      </p>

      <div className="mt-8 space-y-4">
        {sections.map((section, index) => (
          <section
            key={section.title}
            className="animate-rise rounded-2xl border border-border bg-surface p-5 motion-reduce:animate-none"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-subtle">
              {section.title}
            </h2>

            <dl className="mt-3 divide-y divide-border">
              {section.rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 py-2.5"
                >
                  <dt className="shrink-0 text-[0.8125rem] text-subtle">{row.label}</dt>
                  <dd
                    dir={row.ltr ? "ltr" : undefined}
                    className={
                      row.ltr
                        ? "min-w-0 truncate font-mono text-[0.75rem] text-body"
                        : "min-w-0 truncate text-[0.8125rem] text-body"
                    }
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        <section
          className="animate-rise rounded-2xl border border-border bg-surface p-5 motion-reduce:animate-none"
          style={{ animationDelay: "180ms" }}
        >
          <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-subtle">
            {t.onboarding.launchSellingSection}
          </h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {store.product_types.map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/25 bg-brand-500/[0.08] px-3 py-1.5 text-[0.75rem] font-medium text-accent"
              >
                <Icon path={icons.check} className="h-3 w-3" strokeWidth={3} />
                {typeLabels[type] ?? type}
              </span>
            ))}
          </div>
        </section>
      </div>

      <form
        action={formAction}
        className="mt-8 animate-rise motion-reduce:animate-none"
        style={{ animationDelay: "260ms" }}
      >
        <input type="hidden" name="locale" value={locale} />

        {state.status === "unconfigured" ? (
          <FormNotice>{errors.notConfigured}</FormNotice>
        ) : null}

        {formMessage ? (
          <div className="mb-4">
            <FormNotice tone="error">{formMessage}</FormNotice>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className={buttonClass({ size: "xl", className: "w-full sm:w-auto" })}
          >
            {pending ? (
              <>
                <Spinner />
                {t.auth.pending}
              </>
            ) : (
              <>
                <Icon path={icons.bolt} className="h-[1.125rem] w-[1.125rem]" />
                {t.onboarding.launchPublish}
              </>
            )}
          </button>

          <ButtonLink
            href={path(locale, "/onboarding/store")}
            variant="outline"
            size="lg"
          >
            {t.onboarding.launchEdit}
          </ButtonLink>
        </div>
      </form>
    </div>
  );
}
