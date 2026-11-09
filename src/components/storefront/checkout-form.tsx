"use client";

import { Fragment, useActionState, useState } from "react";
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
import { LOCALE_META, type Locale } from "@/i18n/config";
import { formatMinor } from "@/lib/fx/currency";
import { formatMoney } from "@/lib/money";
import type { DeliveryZone } from "@/lib/delivery/queries";
import {
  placeOrderAction,
  type CheckoutFormState,
} from "@/lib/storefront/checkout-actions";
import type {
  CheckoutMarket,
  CheckoutPaymentOption,
} from "@/lib/payments/types";
import type { CartView } from "@/lib/storefront/cart-types";
import { getGiftCopy } from "@/lib/gifts/copy";
import type {
  CheckoutBlockKey,
  CheckoutSettings,
} from "@/lib/checkout/settings";

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
          {text ? (
            <p className="mt-0.5 text-[0.75rem] leading-relaxed text-subtle">
              {text}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function inkFor(hex: string): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return "#ffffff";
  const value = parseInt(match[1], 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#111827" : "#ffffff";
}

function BrandMark({ option }: { option: CheckoutPaymentOption }) {
  if (option.kind === "cod") {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hairline text-subtle">
        <Icon path={icons.bag} className="h-4 w-4" strokeWidth={1.8} />
      </span>
    );
  }

  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[0.625rem] font-bold tracking-tight"
      style={{
        backgroundColor: option.brand.color,
        color: inkFor(option.brand.color),
      }}
      aria-hidden
    >
      {option.brand.short}
    </span>
  );
}

export function CheckoutForm({
  t,
  locale,
  slug,
  cart,
  defaultCountry,
  requiresShipping,
  markets,
  defaultMarket,
  settings,
  payLabel,
  deliveryMode,
  deliveryZones,
  giftEnabled,
}: {
  t: Dictionary;
  locale: Locale;
  slug: string;
  cart: CartView;
  defaultCountry: string;
  requiresShipping: boolean;
  markets: CheckoutMarket[];
  defaultMarket: string;
  settings: CheckoutSettings;
  payLabel: string;
  deliveryMode: "self" | "pashove";
  deliveryZones: DeliveryZone[];
  giftEnabled: boolean;
}) {
  const labels = t.storefront;
  const giftCopy = getGiftCopy(locale);
  const [state, formAction, pending] = useActionState<
    CheckoutFormState,
    FormData
  >(placeOrderAction, INITIAL);
  const [createAccount, setCreateAccount] = useState(false);
  const pashoveDelivery = deliveryMode === "pashove" && requiresShipping;
  const tag = LOCALE_META[locale].tag;

  const marketsForShipping = markets.filter((market) => market.available);
  const initialMarket =
    markets.find((market) => market.code === defaultMarket) ??
    marketsForShipping[0] ??
    markets[0];

  const [marketCode, setMarketCode] = useState(initialMarket?.code ?? defaultMarket);
  const [network, setNetwork] = useState(
    initialMarket?.options[0]?.code ?? "cod",
  );
  const [gift, setGift] = useState(false);

  const selectedMarket =
    markets.find((market) => market.code === marketCode) ?? initialMarket;
  const shippingCountry = selectedMarket?.countryCode ?? defaultCountry;
  const zonesForCountry = deliveryZones.filter(
    (zone) => zone.countryCode === shippingCountry,
  );
  const initialZone =
    zonesForCountry.find((zone) => zone.isDefault) ?? zonesForCountry[0];

  const [zoneId, setZoneId] = useState(initialZone?.id ?? "");
  const selectedZone =
    zonesForCountry.find((zone) => zone.id === zoneId) ?? initialZone;

  const options = selectedMarket?.options ?? [];
  const selectedOption = options.find((entry) => entry.code === network);
  const giftVisible = giftEnabled && settings.showGift;

  const zoneFeeMinor =
    pashoveDelivery &&
    selectedZone &&
    selectedMarket &&
    selectedZone.currency.toUpperCase() ===
      selectedMarket.paymentCurrency.toUpperCase()
      ? selectedZone.feeAmount
      : 0;
  const payableMinor = selectedMarket
    ? selectedMarket.paymentAmountMinor + zoneFeeMinor
    : 0;

  function chooseMarket(code: string) {
    setMarketCode(code);
    const next = markets.find((entry) => entry.code === code);
    setNetwork(next?.options[0]?.code ?? "cod");

    const country = next?.countryCode ?? defaultCountry;
    const zones = deliveryZones.filter((zone) => zone.countryCode === country);
    const zone = zones.find((entry) => entry.isDefault) ?? zones[0];
    setZoneId(zone?.id ?? "");
  }

  const visibleBlocks = settings.blocks.filter(
    (key) => key !== "gift" || giftVisible,
  );

  const numberFor = (key: CheckoutBlockKey) =>
    Math.max(1, visibleBlocks.indexOf(key) + 1);

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

  const renderContact = () => (
    <Step
      number={numberFor("contact")}
      title={labels.checkoutContactTitle}
      text={labels.checkoutContactText}
    >
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
  );

  const renderDelivery = () =>
    requiresShipping ? (
      <Step
        number={numberFor("delivery")}
        title={labels.checkoutShippingTitle}
        text={labels.checkoutShippingText}
      >
        <input type="hidden" name="country" value={shippingCountry} />
        <div className="grid gap-4 sm:grid-cols-2">
          {marketsForShipping.length > 0 ? (
            <SelectField
              name="shippingMarketUi"
              label={locale === "en" ? "Delivery country" : "Pays de livraison"}
              value={marketCode}
              onChange={(event) => chooseMarket(event.target.value)}
            >
              {marketsForShipping.map((market) => (
                <option key={market.code} value={market.code}>
                  {market.countryName} ({market.currency})
                </option>
              ))}
            </SelectField>
          ) : null}

          {pashoveDelivery ? (
            zonesForCountry.length > 0 ? (
              <SelectField
                name="deliveryZone"
                label={locale === "en" ? "Delivery zone" : "Zone de livraison"}
                value={zoneId}
                onChange={(event) => setZoneId(event.target.value)}
                error={fieldError("deliveryZone")}
              >
                {zonesForCountry.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} —{" "}
                    {formatMoney(zone.feeAmount, zone.currency, tag)}
                  </option>
                ))}
              </SelectField>
            ) : (
              <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-amber-700 dark:text-amber-300">
                {locale === "en"
                  ? "Pashove Delivery is not available yet in this country."
                  : "Pashove Delivery n’est pas encore disponible dans ce pays."}
              </p>
            )
          ) : null}

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
    );

  const renderSummary = () => {
    const summaryZone = pashoveDelivery ? selectedZone : null;
    const summaryZoneSame =
      summaryZone &&
      summaryZone.currency.toUpperCase() === cart.currency.toUpperCase()
        ? summaryZone.feeAmount
        : 0;
    const summaryZoneForeign =
      summaryZone &&
      summaryZone.currency.toUpperCase() !== cart.currency.toUpperCase()
        ? summaryZone
        : null;
    const summaryShipping = cart.shipping + summaryZoneSame;
    const summaryTotal = cart.total + summaryZoneSame;

    return (
      <Step number={numberFor("summary")} title={labels.checkoutSummaryTitle} text="">
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
            {summaryZoneForeign
              ? `${summaryZoneForeign.name} — ${formatMoney(
                  summaryZoneForeign.feeAmount,
                  summaryZoneForeign.currency,
                  tag,
                )}`
              : summaryShipping === 0
                ? labels.freeShipping
                : formatMoney(summaryShipping, cart.currency, tag)}
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-hairline pt-2 text-[1rem] font-medium">
          <dt className="text-fg">{labels.total}</dt>
          <dd className="tabular-nums text-fg">
            {formatMoney(summaryTotal, cart.currency, tag)}
          </dd>
        </div>
      </dl>
      {summaryZoneForeign ? (
        <p className="mt-2 text-[0.6875rem] leading-relaxed text-subtle">
          {locale === "en"
            ? `Shipping (${formatMoney(summaryZoneForeign.feeAmount, summaryZoneForeign.currency, tag)}) is added in the payment currency.`
            : `La livraison (${formatMoney(summaryZoneForeign.feeAmount, summaryZoneForeign.currency, tag)}) s’ajoute dans la devise de paiement.`}
        </p>
      ) : null}
    </Step>
    );
  };

  const renderGift = () =>
    giftVisible ? (
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
    ) : null;

  const renderPayment = () => (
    <Step
      number={numberFor("payment")}
      title={labels.checkoutPaymentTitle}
      text={labels.checkoutPaymentText}
    >
      {markets.length > 1 ? (
        <div className="mb-3">
          <SelectField
            name="paymentMarketUi"
            label="Pays de paiement"
            value={marketCode}
            onChange={(event) => chooseMarket(event.target.value)}
          >
            {markets.map((market) => (
              <option key={market.code} value={market.code} disabled={!market.available}>
                {market.countryName}
                {market.available ? "" : " — bientôt"}
              </option>
            ))}
          </SelectField>
        </div>
      ) : null}

      {selectedMarket &&
      selectedMarket.available &&
      selectedMarket.paymentCurrency !== cart.currency ? (
        <p className="mb-3 rounded-xl border border-brand-500/20 bg-brand-500/[0.05] px-3 py-2.5 text-[0.75rem] leading-relaxed text-subtle">
          Total à payer :{" "}
          <span className="font-medium text-fg">
            {formatMinor(payableMinor, selectedMarket.paymentCurrency)}{" "}
            {selectedMarket.paymentCurrency}
          </span>
          {" · "}1 {cart.currency} ≈{" "}
          {new Intl.NumberFormat(LOCALE_META[locale].tag, {
            maximumSignificantDigits: 5,
          }).format(selectedMarket.fxRate)}{" "}
          {selectedMarket.paymentCurrency}
        </p>
      ) : null}

      {selectedOption &&
      selectedOption.clientFeeMinor > 0 &&
      selectedMarket ? (
        <div className="mb-3 rounded-xl border border-brand-500/20 bg-brand-500/[0.05] px-3 py-2.5 text-[0.75rem] leading-relaxed">
          <div className="flex justify-between gap-3 text-subtle">
            <span>Frais de paiement</span>
            <span className="tabular-nums">
              {formatMinor(
                selectedOption.clientFeeMinor,
                selectedMarket.paymentCurrency,
              )}{" "}
              {selectedMarket.paymentCurrency}
            </span>
          </div>
          <div className="mt-1 flex justify-between gap-3 font-medium text-fg">
            <span>Total à payer</span>
            <span className="tabular-nums">
              {formatMinor(
                payableMinor + selectedOption.clientFeeMinor,
                selectedMarket.paymentCurrency,
              )}{" "}
              {selectedMarket.paymentCurrency}
            </span>
          </div>
        </div>
      ) : null}

      {selectedMarket && !selectedMarket.available ? (
        <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-amber-700 dark:text-amber-300">
          Ce pays n’est pas encore disponible au paiement (conversion de devise
          à venir).
        </p>
      ) : options.length === 0 ? (
        <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2.5 text-[0.75rem] leading-relaxed text-amber-700 dark:text-amber-300">
          {labels.checkoutPaymentUnavailable}
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border">
            {options.map((option, index) => {
              const active = network === option.code;
              const label =
                option.code === "cod" ? labels.checkoutCodLabel : option.label;
              const hint =
                option.code === "cod"
                  ? labels.paymentCodHint
                  : option.requiresCard
                    ? labels.paymentCardHint
                    : option.provider === "saspay"
                      ? labels.paymentLiveNote
                      : labels.paymentMockNote;

              return (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => setNetwork(option.code)}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-3 px-3 py-3.5 text-start transition-colors ${
                    index > 0 ? "border-t border-hairline" : ""
                  } ${active ? "bg-brand-500/[0.08]" : "bg-surface hover:bg-hairline/40"}`}
                >
                  <BrandMark option={option} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5 text-[0.875rem] font-medium text-fg">
                      {label}
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
                    <span className="mt-0.5 block truncate text-[0.6875rem] leading-relaxed text-subtle">
                      {hint}
                    </span>
                  </span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      active
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-border text-transparent"
                    }`}
                  >
                    <Icon path={icons.check} className="h-3 w-3" strokeWidth={3} />
                  </span>
                </button>
              );
            })}
          </div>

          {selectedOption && selectedOption.requiresPhone ? (
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

          {selectedOption?.requiresOtp ? (
            <div className="mt-4">
              <TextField
                name="paymentOtp"
                label="Code de confirmation"
                dir="ltr"
                inputMode="numeric"
                maxLength={10}
                help={
                  selectedOption.otpInstructions ??
                  "Compose le code demandé par ton opérateur, puis saisis-le ici."
                }
                error={fieldError("paymentOtp")}
              />
            </div>
          ) : null}

          {selectedOption?.requiresCard ? (
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
  );

  const renderers: Record<CheckoutBlockKey, () => React.ReactNode> = {
    contact: renderContact,
    delivery: renderDelivery,
    gift: renderGift,
    summary: renderSummary,
    payment: renderPayment,
  };

  return (
    <form
      action={formAction}
      noValidate
      className={settings.preset === "detailed" ? "space-y-4" : "space-y-3"}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="paymentMarket" value={marketCode} />
      <input type="hidden" name="paymentNetwork" value={network} />

      {visibleBlocks.map((key) => (
        <Fragment key={key}>{renderers[key]()}</Fragment>
      ))}

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
        disabled={pending || !selectedOption || (pashoveDelivery && !selectedZone)}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-[0.875rem] font-medium text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? <Spinner /> : <Icon path={icons.lock} className="h-4 w-4" strokeWidth={2} />}
        {pending ? labels.checkoutConfirming : payLabel}
      </button>
    </form>
  );
}
