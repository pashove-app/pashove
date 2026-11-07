"use client";

import { useActionState, useState } from "react";
import {
  Checkbox,
  PasswordField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/ui/field";
import { Icon, icons, Spinner } from "@/components/ui/primitives";
import type { Dictionary } from "@/i18n/get-dictionary";
import { interpolate } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { PAYOUT_COUNTRIES } from "@/lib/finance/providers";
import {
  placeOrderAction,
  type CheckoutFormState,
} from "@/lib/storefront/checkout-actions";
import type { CheckoutPaymentOption, PaymentMethod } from "@/lib/payments/types";
import type { CartView } from "@/lib/storefront/cart-types";
import { getGiftCopy } from "@/lib/gifts/copy";

const INITIAL: CheckoutFormState = { status: "idle" };

function Step({
  number,
  title,
  text,
  children,
}: {
  number: number;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[0.75rem] font-semibold text-white">
          {number}
        </span>
        <div>
          <h2 className="text-[0.9375rem] font-medium text-fg">{title}</h2>
          <p className="mt-0.5 text-[0.75rem] leading-relaxed text-subtle">
            {text}
          </p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function CheckoutForm({
  t,
  locale,
  slug,
  cart,
  defaultCountry,
  requiresShipping,
  paymentMethods,
  giftEnabled,
}: {
  t: Dictionary;
  locale: Locale;
  slug: string;
  cart: CartView;
  defaultCountry: string;
  requiresShipping: boolean;
  paymentMethods: CheckoutPaymentOption[];
  giftEnabled: boolean;
}) {
  const labels = t.storefront;
  const giftCopy = getGiftCopy(locale);
  const [state, formAction, pending] = useActionState<
    CheckoutFormState,
    FormData
  >(placeOrderAction, INITIAL);
  const [createAccount, setCreateAccount] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>(
    paymentMethods[0]?.code ?? "cod",
  );
  const [gift, setGift] = useState(false);

  const methodCopy: Record<
    PaymentMethod,
    { label: string; hint: string; icon: keyof typeof icons }
  > = {
    cod: {
      label: labels.checkoutCodLabel,
      hint: labels.paymentCodHint,
      icon: "bag",
    },
    orange_money: {
      label: labels.paymentOrangeMoney,
      hint: labels.paymentOrangeHint,
      icon: "phone",
    },
    wave: {
      label: labels.paymentWave,
      hint: labels.paymentWaveHint,
      icon: "wallet",
    },
    mtn_money: {
      label: labels.paymentMtnMoney,
      hint: labels.paymentMtnHint,
      icon: "phone",
    },
    moov_money: {
      label: labels.paymentMoovMoney,
      hint: labels.paymentMoovHint,
      icon: "phone",
    },
    card: {
      label: labels.paymentCard,
      hint: labels.paymentCardHint,
      icon: "card",
    },
  };

  const selectedMethod = methodCopy[method];
  const selectedOption = paymentMethods.find((entry) => entry.code === method);

  const fieldError = (key: string) => {
    const messageKey = state.fieldErrors?.[key];
    if (!messageKey) return undefined;

    return (
      labels[messageKey as keyof typeof labels] ??
      t.auth.errors[messageKey as keyof typeof t.auth.errors] ??
      messageKey
    );
  };

  const giftFieldError = (key: string) => {
    const messageKey = state.fieldErrors?.[key];
    if (!messageKey) return undefined;

    if (messageKey === "giftNameInvalid" || messageKey === "giftEmailInvalid") {
      return giftCopy.checkout.required;
    }
    if (messageKey === "giftDateInvalid") {
      return giftCopy.checkout.required;
    }

    return giftCopy.checkout.required;
  };

  const giftServerMessage =
    state.messageKey === "giftDisabled"
      ? giftCopy.checkout.disabled
      : state.messageKey === "giftMultipleServices"
        ? giftCopy.checkout.multipleServices
        : null;

  const serverMessage = state.messageKey
    ? interpolate(
        (labels[state.messageKey as keyof typeof labels] as string | undefined) ??
          "",
        state.messageVars ?? {},
      ) || giftServerMessage
    : null;

  return (
    <form action={formAction} noValidate className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="paymentMethod" value={method} />

      <Step number={1} title={labels.checkoutContactTitle} text={labels.checkoutContactText}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="name"
            label={labels.checkoutNameLabel}
            autoComplete="name"
            maxLength={120}
            error={fieldError("name")}
          />
          <TextField
            name="phone"
            label={labels.checkoutPhoneLabel}
            type="tel"
            dir="ltr"
            autoComplete="tel"
            maxLength={40}
            error={fieldError("phone")}
          />
          <div className="sm:col-span-2">
            <TextField
              name="email"
              label={labels.checkoutEmailLabel}
              type="email"
              dir="ltr"
              autoComplete="email"
              maxLength={254}
              error={fieldError("email")}
            />
          </div>

          <div className="sm:col-span-2 border-t border-hairline pt-4">
            <Checkbox
              name="createAccount"
              checked={createAccount}
              onChange={(event) => setCreateAccount(event.target.checked)}
              label={
                <span>
                  <span className="block font-medium text-body">
                    {t.customer.createAccount}
                  </span>
                  <span className="mt-0.5 block text-[0.75rem] text-subtle">
                    {t.customer.createAccountHint}
                  </span>
                </span>
              }
            />

            {createAccount ? (
              <div className="mt-4">
                <PasswordField
                  name="password"
                  label={t.customer.passwordLabel}
                  autoComplete="new-password"
                  help={t.customer.passwordShort}
                  revealLabel={t.auth.showPassword}
                  concealLabel={t.auth.hidePassword}
                  error={fieldError("password")}
                />
              </div>
            ) : null}
          </div>
        </div>
      </Step>

      {requiresShipping ? (
      <Step number={2} title={labels.checkoutShippingTitle} text={labels.checkoutShippingText}>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            name="country"
            label={labels.checkoutCountryLabel}
            defaultValue={
              PAYOUT_COUNTRIES.includes(defaultCountry as never)
                ? defaultCountry
                : "SN"
            }
            error={fieldError("country")}
          >
            {PAYOUT_COUNTRIES.map((code) => (
              <option key={code} value={code}>
                {t.countries_names[code as keyof Dictionary["countries_names"]] ?? code}
              </option>
            ))}
          </SelectField>
          <TextField
            name="city"
            label={labels.checkoutCityLabel}
            autoComplete="address-level2"
            maxLength={100}
            error={fieldError("city")}
          />
          <div className="sm:col-span-2">
            <TextField
              name="address"
              label={labels.checkoutAddressLabel}
              autoComplete="street-address"
              maxLength={200}
              error={fieldError("address")}
            />
          </div>
          <div className="sm:col-span-2">
            <TextField
              name="extra"
              label={labels.checkoutExtraLabel}
              autoComplete="address-line2"
              maxLength={200}
              error={fieldError("extra")}
            />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField
              name="notes"
              label={labels.checkoutNotesLabel}
              maxLength={500}
              rows={3}
              error={fieldError("notes")}
            />
          </div>
        </div>
      </Step>
      ) : (
        <div className="flex items-start gap-3 rounded-3xl border border-emerald-400/25 bg-emerald-400/[0.06] p-5 sm:p-6">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Icon path={icons.check} className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div>
            <p className="text-[0.9375rem] font-medium text-fg">
              {labels.checkoutNoShippingTitle}
            </p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-subtle">
              {labels.checkoutNoShippingText}
            </p>
          </div>
        </div>
      )}

      <Step
        number={requiresShipping ? 3 : 2}
        title={labels.checkoutSummaryTitle}
        text=""
      >
        <div className="divide-y divide-hairline">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[0.875rem] font-medium text-fg">
                  <span className="truncate">{item.name}</span>
                  {item.kind === "bundle" ? (
                    <span className="shrink-0 rounded-full bg-brand-500/10 px-1.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-wide text-accent">
                      {labels.bundleCartBadge}
                    </span>
                  ) : null}
                </p>
                {item.variantLabel ? (
                  <p className="mt-0.5 text-[0.75rem] text-subtle">{item.variantLabel}</p>
                ) : null}
                {item.serviceStartsAtLabel ? (
                  <p className="mt-0.5 text-[0.75rem] text-subtle">
                    {item.serviceStartsAtLabel}
                  </p>
                ) : null}
                <p className="mt-0.5 text-[0.75rem] text-faint">
                  {labels.quantity} : {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-[0.875rem] font-medium tabular-nums text-fg">
                {item.lineTotalLabel}
              </p>
            </div>
          ))}
        </div>

        <dl className="mt-2 space-y-2 border-t border-hairline pt-3 text-[0.875rem]">
          <div className="flex justify-between gap-3">
            <dt className="text-subtle">{labels.subtotal}</dt>
            <dd className="tabular-nums text-body">{cart.subtotalLabel}</dd>
          </div>
          {cart.discountAmountLabel ? (
            <div className="flex justify-between gap-3">
              <dt className="text-subtle">
                {labels.discountLabel}
                {cart.discount ? ` (${cart.discount.code})` : ""}
              </dt>
              <dd className="tabular-nums text-emerald-600 dark:text-emerald-400">
                −{cart.discountAmountLabel}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-subtle">{labels.shipping}</dt>
            <dd className="tabular-nums text-body">
              {cart.shipping === 0 ? labels.freeShipping : cart.shippingLabel}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-hairline pt-2 text-[1rem] font-medium">
            <dt className="text-fg">{labels.total}</dt>
            <dd className="tabular-nums text-fg">{cart.totalLabel}</dd>
          </div>
        </dl>
      </Step>

      {giftEnabled ? (
        <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
              <Icon path={icons.gift} className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="text-[0.9375rem] font-medium text-fg">
                {giftCopy.checkout.title}
              </h2>
              <p className="mt-0.5 text-[0.75rem] leading-relaxed text-subtle">
                {giftCopy.checkout.text}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Checkbox
              name="isGift"
              checked={gift}
              onChange={(event) => setGift(event.target.checked)}
              label={
                <span className="font-medium text-body">
                  {giftCopy.checkout.toggle}
                </span>
              }
            />
          </div>

          {gift ? (
            <div className="mt-4 space-y-4 border-t border-hairline pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  name="giftRecipientName"
                  label={giftCopy.checkout.recipientName}
                  maxLength={120}
                  error={giftFieldError("giftRecipientName")}
                />
                <TextField
                  name="giftRecipientEmail"
                  label={giftCopy.checkout.recipientEmail}
                  type="email"
                  dir="ltr"
                  maxLength={254}
                  error={giftFieldError("giftRecipientEmail")}
                />
              </div>

              <TextAreaField
                name="giftMessage"
                label={giftCopy.checkout.message}
                hint={giftCopy.checkout.messageHint}
                maxLength={500}
                rows={3}
                error={giftFieldError("giftMessage")}
              />

              <TextField
                name="giftScheduledDate"
                label={giftCopy.checkout.date}
                type="date"
                help={giftCopy.checkout.dateHint}
                error={giftFieldError("giftScheduledDate")}
              />

              <p className="rounded-xl border border-brand-500/20 bg-brand-500/[0.05] px-3 py-2.5 text-[0.75rem] leading-relaxed text-subtle">
                {giftCopy.checkout.info}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      <Step
        number={requiresShipping ? 4 : 3}
        title={labels.checkoutPaymentTitle}
        text={labels.checkoutPaymentText}
      >
        {paymentMethods.length === 0 ? (
          <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-amber-700 dark:text-amber-300">
            {labels.checkoutPaymentUnavailable}
          </p>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              {paymentMethods.map((option) => {
                const copy = methodCopy[option.code];
                const active = method === option.code;

                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => setMethod(option.code)}
                    aria-pressed={active}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 text-start transition-colors ${
                      active
                        ? "border-brand-500 bg-brand-500/[0.07]"
                        : "border-border bg-surface hover:border-border-strong"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        active
                          ? "bg-brand-500 text-white"
                          : "bg-hairline text-subtle"
                      }`}
                    >
                      <Icon path={icons[copy.icon]} className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-1.5 text-[0.8125rem] font-medium text-fg">
                        {copy.label}
                        {option.provider === "mock" ? (
                          <span className="rounded-full border border-brand-500/25 bg-brand-500/10 px-1.5 py-0.5 text-[0.5rem] font-semibold uppercase tracking-wide text-accent">
                            {labels.paymentMockBadge}
                          </span>
                        ) : option.provider === "saspay" ? (
                          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[0.5rem] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                            {labels.paymentLiveBadge}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-[0.6875rem] leading-relaxed text-subtle">
                        {copy.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedMethod && method !== "cod" ? (
              <p className="mt-3 rounded-xl border border-brand-500/20 bg-brand-500/[0.05] px-3 py-2.5 text-[0.75rem] leading-relaxed text-subtle">
                {selectedOption?.provider === "saspay"
                  ? labels.paymentLiveNote
                  : labels.paymentMockNote}
              </p>
            ) : null}

            {method === "orange_money" ||
            method === "wave" ||
            method === "mtn_money" ||
            method === "moov_money" ? (
              <div className="mt-4">
                <TextField
                  name="paymentPhone"
                  label={labels.paymentPhoneLabel}
                  type="tel"
                  dir="ltr"
                  autoComplete="tel"
                  placeholder={labels.paymentPhoneHint}
                  maxLength={40}
                  error={fieldError("paymentPhone")}
                />
              </div>
            ) : null}

            {method === "card" ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextField
                    name="cardNumber"
                    label={labels.cardNumberLabel}
                    dir="ltr"
                    autoComplete="cc-number"
                    placeholder="4242 4242 4242 4242"
                    maxLength={30}
                    error={fieldError("cardNumber")}
                  />
                </div>
                <TextField
                  name="cardExpiry"
                  label={labels.cardExpiryLabel}
                  dir="ltr"
                  autoComplete="cc-exp"
                  placeholder="MM/AA"
                  maxLength={7}
                  error={fieldError("cardExpiry")}
                />
                <TextField
                  name="cardCvv"
                  label={labels.cardCvvLabel}
                  dir="ltr"
                  autoComplete="cc-csc"
                  placeholder="123"
                  maxLength={4}
                  error={fieldError("cardCvv")}
                />
              </div>
            ) : null}

            {selectedOption ? null : (
              <p className="mt-3 text-[0.75rem] font-medium text-red-500">
                {labels.checkoutPaymentInvalid}
              </p>
            )}
          </>
        )}
      </Step>

      {serverMessage ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-red-600 dark:text-red-400"
        >
          {serverMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !selectedOption}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-[0.875rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? <Spinner /> : <Icon path={icons.lock} className="h-4 w-4" strokeWidth={2} />}
        {pending ? labels.checkoutConfirming : labels.checkoutConfirm}
      </button>
    </form>
  );
}
