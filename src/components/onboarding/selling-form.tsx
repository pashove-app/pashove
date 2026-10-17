"use client";

import { useActionState } from "react";
import { SelectionCard } from "@/components/onboarding/selection-card";
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
import { useFieldErrors } from "@/lib/forms/use-field-errors";
import { saveSellingAction } from "@/lib/stores/actions";
import { INITIAL_STORE_FORM_STATE } from "@/lib/stores/types";

/**
 * Étape 3 : ce que la boutique vend.
 *
 * Choix multiple — un marchand peut très bien vendre des vêtements, un e-book
 * et des consultations. Les cartes sont des cases à cocher, donc le clavier et
 * les lecteurs d'écran les traitent comme telles.
 */
export function SellingForm({
  t,
  locale,
  stepLabel,
  productTypes,
}: SectionProps & { stepLabel: string; productTypes: string[] }) {
  const [state, formAction, pending] = useActionState(
    saveSellingAction,
    INITIAL_STORE_FORM_STATE,
  );

  const { corrected, clear } = useFieldErrors(state);

  const errors = t.onboarding.errors as Record<string, string>;
  const formMessage = state.messageKey ? errors[state.messageKey] : undefined;

  const groupKey = state.fieldErrors?.productTypes;
  const groupError = groupKey && !corrected.productTypes ? errors[groupKey] : undefined;

  const cards = [
    {
      value: "physical",
      icon: "box",
      label: t.onboarding.productPhysical,
      hint: t.onboarding.productPhysicalHint,
    },
    {
      value: "digital",
      icon: "download",
      label: t.onboarding.productDigital,
      hint: t.onboarding.productDigitalHint,
    },
    {
      value: "service",
      icon: "calendar",
      label: t.onboarding.productService,
      hint: t.onboarding.productServiceHint,
    },
  ] as const;

  return (
    <div>
      <StepProgress current={3} total={4} label={stepLabel} />

      <h1
        id="selling-title"
        className="mt-6 text-[clamp(2.05rem,1.35rem+2.4vw,2.85rem)] font-semibold leading-[1.04] tracking-[-0.045em] text-balance text-fg"
      >
        {t.onboarding.sellingTitle}
      </h1>
      <p className="mt-4 max-w-lg text-[0.9875rem] leading-relaxed text-muted">
        {t.onboarding.sellingSubtitle}
      </p>

      <form action={formAction} noValidate className="mt-10 space-y-9">
        <input type="hidden" name="locale" value={locale} />

        <div className="space-y-2.5">
          <div
            role="group"
            aria-labelledby="selling-title"
            className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
            onChange={() => clear("productTypes")}
          >
            {cards.map((card) => (
              <SelectionCard
                key={card.value}
                type="checkbox"
                name="productType"
                value={card.value}
                icon={card.icon}
                label={card.label}
                hint={card.hint}
                defaultChecked={productTypes.includes(card.value)}
                stacked
              />
            ))}
          </div>

          {groupError ? (
            <p role="alert" className="text-[0.75rem] text-red-500 dark:text-red-400">
              {groupError}
            </p>
          ) : null}
        </div>

        {state.status === "unconfigured" ? (
          <FormNotice>{errors.notConfigured}</FormNotice>
        ) : null}

        {formMessage ? <FormNotice tone="error">{formMessage}</FormNotice> : null}

        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink
            href={path(locale, "/onboarding/profile")}
            variant="outline"
            size="lg"
          >
            <Icon path={icons.arrowRight} className="h-4 w-4 rotate-180 rtl:rotate-0" />
            {t.onboarding.back}
          </ButtonLink>

          <button type="submit" disabled={pending} className={buttonClass({ size: "lg" })}>
            {pending ? (
              <>
                <Spinner />
                {t.auth.pending}
              </>
            ) : (
              <>
                {t.onboarding.next}
                <Icon path={icons.arrowRight} className="h-4 w-4 rtl:rotate-180" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
